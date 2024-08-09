use std::collections::{HashMap, HashSet, VecDeque};
use std::fmt::Debug;
use std::hash::Hash;

use serde::Deserialize;
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{
    ast::{
        Decl, DefaultDecl, ExportSpecifier, Id, Ident, ImportSpecifier, ModuleDecl,
        ModuleExportName, ModuleItem, ObjectPatProp, Pat, Program, Stmt,
    },
    visit::{noop_visit_mut_type, noop_visit_type, Visit, VisitMut, VisitWith},
};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

/// Analyze Every Id
#[derive(Default, Debug)]
pub struct CountVisitor {
    pub set: HashSet<Id>,
}

impl CountVisitor {
    pub fn count<T>(expr: &T) -> HashSet<Id>
    where
        T: VisitWith<Self>,
    {
        let mut counter = Self::default();
        expr.visit_with(&mut counter);
        counter.set
    }
}

impl Visit for CountVisitor {
    fn visit_ident(&mut self, n: &Ident) {
        self.set.insert(n.to_id());
    }
}

#[derive(Default, Debug)]
pub struct ImportVisitor {
    pub decl_refs: HashMap<Id, HashSet<Id>>,
    pub global_refs: HashSet<Id>,

    /// Must remove if said to be.
    ///
    /// `export const v = 233;`
    pub export_decls: HashMap<String, Id>,

    /// Just a reference, can be removed without change decl.
    ///
    /// `export { foo }`
    pub export_refs: HashMap<String, HashSet<Id>>,
}

impl ImportVisitor {
    fn insert_decl_refs(&mut self, id: Id, refs: HashSet<Id>) {
        self.decl_refs
            .entry(id)
            .or_insert_with(|| HashSet::new())
            .extend(refs)
    }

    fn insert_decls_refs(&mut self, ids: &[Id], refs: &HashSet<Id>) {
        for id in ids {
            self.insert_decl_refs(id.clone(), refs.clone());
        }
    }

    fn insert_global_refs(&mut self, refs: HashSet<Id>) {
        self.global_refs.extend(refs);
    }

    fn insert_export_decl(&mut self, name: String, id: Id) {
        self.export_decls.insert(name, id);
    }

    fn insert_export_decl_ident(&mut self, ident: &Ident) {
        self.insert_export_decl(ident.sym.to_string(), ident.to_id());
    }

    fn insert_export_refs(&mut self, name: String, refs: HashSet<Id>) {
        self.export_refs
            .entry(name)
            .or_insert_with(|| HashSet::new())
            .extend(refs);
    }

    fn insert_export_refs_default(&mut self, refs: HashSet<Id>) {
        self.insert_export_refs("default".to_string(), refs);
    }

    fn register_decl(&mut self, id: Id) {
        self.decl_refs.entry(id).or_insert_with(|| HashSet::new());
    }
}

impl ImportVisitor {
    fn find_idents(&mut self, n: &Pat) -> Vec<Id> {
        match n {
            Pat::Ident(i) => vec![i.to_id()],
            Pat::Array(a) => a
                .elems
                .iter()
                .flatten()
                .flat_map(|x| self.find_idents(x))
                .collect(),
            Pat::Rest(r) => self.find_idents(&r.arg),
            Pat::Object(o) => o
                .props
                .iter()
                .flat_map(|x| match x {
                    ObjectPatProp::KeyValue(kv) => self.find_idents(&kv.value),
                    ObjectPatProp::Assign(ass) => {
                        if let Some(value) = &ass.value {
                            let refs = CountVisitor::count(value);
                            self.insert_decl_refs(ass.key.to_id(), refs);
                        }
                        return vec![ass.key.to_id()];
                    }
                    ObjectPatProp::Rest(rest) => self.find_idents(&rest.arg),
                })
                .collect(),
            Pat::Assign(ass) => {
                let ids = self.find_idents(&ass.left);
                let refs = CountVisitor::count(&ass.right);
                self.insert_decls_refs(&ids, &refs);
                ids
            }

            // ignore
            Pat::Invalid(_) => panic!("invalid code"),
            Pat::Expr(_) => panic!("invalid code"),
        }
    }
}

impl Visit for ImportVisitor {
    noop_visit_type!();

    fn visit_module_item(&mut self, n: &ModuleItem) {
        match n {
            ModuleItem::ModuleDecl(decl) => {
                match decl {
                    ModuleDecl::Import(decl) => {
                        for specifier in &decl.specifiers {
                            match specifier {
                                // import { a as b } from "..."
                                ImportSpecifier::Named(name) => {
                                    self.register_decl(name.local.to_id());
                                }
                                // import mod from "..."
                                ImportSpecifier::Default(def) => {
                                    self.register_decl(def.local.to_id());
                                }
                                // import * as mod from "..."
                                ImportSpecifier::Namespace(ns) => {
                                    self.register_decl(ns.local.to_id());
                                }
                            }
                        }
                    }

                    ModuleDecl::ExportDecl(decl) => match &decl.decl {
                        // export class foo {}
                        Decl::Class(c) => {
                            let refs = CountVisitor::count(&c.class);
                            self.insert_decl_refs(c.ident.to_id(), refs);
                            self.insert_export_decl_ident(&c.ident);
                        }
                        // export function foo {}
                        // export function* foo {}
                        Decl::Fn(f) => {
                            let refs = CountVisitor::count(&f.function);
                            self.insert_decl_refs(f.ident.to_id(), refs);
                            self.insert_export_decl_ident(&f.ident);
                        }
                        // export const foo = ...
                        Decl::Var(v) => {
                            for decl in &v.decls {
                                let ids = self.find_idents(&decl.name);

                                let refs = match &decl.init {
                                    Some(init) => CountVisitor::count(init),
                                    None => HashSet::new(),
                                };
                                self.insert_decls_refs(&ids, &refs);

                                for id in ids {
                                    let ident = Ident::from(id);
                                    self.insert_export_decl_ident(&ident);
                                }
                            }
                        }

                        // invalid
                        Decl::Using(_) => panic!("invalid code"),
                        Decl::TsInterface(_) => panic!("invalid code"),
                        Decl::TsTypeAlias(_) => panic!("invalid code"),
                        Decl::TsEnum(_) => panic!("invalid code"),
                        Decl::TsModule(_) => panic!("invalid code"),
                    },

                    ModuleDecl::ExportDefaultDecl(decl) => match &decl.decl {
                        // export default class {}
                        // export default class foo {}
                        DefaultDecl::Class(c) => {
                            let refs = CountVisitor::count(&c.class);
                            self.insert_export_refs_default(refs);
                        }

                        // export default function () {}
                        // export default function* () {}
                        // export default function foo() {}
                        // export default function* foo() {}
                        // export default async function () {}
                        // export default async function* () {}
                        // export default async function foo() {}
                        // export default async function* foo() {}
                        DefaultDecl::Fn(f) => {
                            let refs = CountVisitor::count(&f.function);
                            self.insert_export_refs_default(refs);
                        }

                        // invalid
                        DefaultDecl::TsInterfaceDecl(_) => panic!("invalid code"),
                    },

                    // export default foo;
                    ModuleDecl::ExportDefaultExpr(expr) => {
                        let refs = CountVisitor::count(&expr.expr);
                        self.insert_export_refs_default(refs);
                    }

                    // export * from "source";
                    // do nothing;
                    ModuleDecl::ExportAll(_) => {}

                    ModuleDecl::ExportNamed(name) => {
                        // export { foo, bar as foo };
                        if name.src.is_none() {
                            for specifier in &name.specifiers {
                                match specifier {
                                    ExportSpecifier::Named(name) => {
                                        let ident = match &name.orig {
                                            ModuleExportName::Ident(i) => i,
                                            ModuleExportName::Str(_) => panic!("invalid code"),
                                        };

                                        let exported_name = match &name.exported {
                                            // export { foo as bar }
                                            Some(ModuleExportName::Ident(i)) => i.sym.to_string(),
                                            // export { foo as "bar" }
                                            Some(ModuleExportName::Str(s)) => s.value.to_string(),
                                            // export { foo }
                                            None => ident.sym.to_string(),
                                        };

                                        self.insert_export_refs(
                                            exported_name,
                                            HashSet::from([ident.to_id()]),
                                        );
                                    }

                                    // invalid
                                    ExportSpecifier::Namespace(_) => panic!("invalid code"),
                                    ExportSpecifier::Default(_) => panic!("invalid code"),
                                }
                            }
                        }

                        // export { foo } from "source";
                        // just ignore
                    }

                    // invalid
                    ModuleDecl::TsImportEquals(_) => {}
                    ModuleDecl::TsExportAssignment(_) => {}
                    ModuleDecl::TsNamespaceExport(_) => {}
                }
            }

            ModuleItem::Stmt(stmt) => match stmt {
                Stmt::Decl(decl) => {
                    match decl {
                        Decl::Class(c) => {
                            let refs = CountVisitor::count(&c.class);
                            self.insert_decl_refs(c.ident.to_id(), refs);
                        }
                        Decl::Fn(f) => {
                            let refs = CountVisitor::count(&f.function);
                            self.insert_decl_refs(f.ident.to_id(), refs);
                        }
                        Decl::Var(v) => {
                            for decl in &v.decls {
                                let ids = self.find_idents(&decl.name);
                                let refs = match &decl.init {
                                    Some(init) => CountVisitor::count(init),
                                    None => HashSet::new(),
                                };
                                self.insert_decls_refs(&ids, &refs);
                            }
                        }

                        // invalid
                        Decl::Using(_) => panic!("invalid code"),
                        Decl::TsInterface(_) => panic!("invalid code"),
                        Decl::TsTypeAlias(_) => panic!("invalid code"),
                        Decl::TsEnum(_) => panic!("invalid code"),
                        Decl::TsModule(_) => panic!("invalid code"),
                    }
                }
                Stmt::Block(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Empty(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Debugger(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::With(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Return(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Labeled(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Break(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Continue(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::If(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Switch(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Throw(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Try(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::While(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::DoWhile(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::For(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::ForIn(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::ForOf(x) => self.insert_global_refs(CountVisitor::count(x)),
                Stmt::Expr(x) => self.insert_global_refs(CountVisitor::count(x)),
            },
        }
    }
}

#[derive(Debug)]
pub struct RemoveVisitor {
    pub names: HashSet<String>,
    pub ids: HashSet<Id>,
}

impl RemoveVisitor {
    fn should_remove_ident(&self, ident: &Ident) -> bool {
        self.ids.contains(&ident.to_id())
    }

    fn should_remove_module_export(&self, n: &ModuleExportName) -> bool {
        self.names.contains(&match n {
            ModuleExportName::Ident(ident) => ident.sym.to_string(),
            ModuleExportName::Str(s) => s.value.to_string(),
        })
    }

    fn should_remove_pat(&mut self, n: &mut Pat) -> bool {
        match n {
            // foo
            Pat::Ident(i) => self.should_remove_ident(&i.id),
            // [ foo, bar ]
            Pat::Array(a) => {
                a.elems.iter_mut().for_each(|x| {
                    if x.as_mut().is_some_and(|p| self.should_remove_pat(p)) {
                        *x = None;
                    }
                });
                a.elems.iter().all(|x| x.is_none())
            }
            // { foo, bar }
            Pat::Object(o) => {
                o.props.retain_mut(|i| match i {
                    // { key: value }
                    ObjectPatProp::KeyValue(kv) => !self.should_remove_pat(&mut kv.value),
                    // { foo = 233 }
                    ObjectPatProp::Assign(a) => !self.should_remove_ident(&a.key.id),
                    // { ...rest }
                    ObjectPatProp::Rest(rs) => !self.should_remove_pat(&mut rs.arg),
                });
                o.props.is_empty()
            }
            // [ ...bar ]
            Pat::Rest(rs) => self.should_remove_pat(&mut rs.arg),
            // [ foo = 233 ]
            Pat::Assign(a) => self.should_remove_pat(&mut a.left),
            // ???
            Pat::Expr(_) => panic!("invalid code"),
            Pat::Invalid(_) => panic!("invalid code"),
        }
    }

    fn should_remove_module_decl(&mut self, n: &mut ModuleDecl) -> bool {
        match n {
            ModuleDecl::ExportDecl(decl) => {
                match &mut decl.decl {
                    // export class foo { }
                    Decl::Class(c) => self.should_remove_ident(&c.ident),

                    // export function foo() { }
                    Decl::Fn(f) => self.should_remove_ident(&f.ident),

                    // export const foo = ...
                    // export let foo = ...
                    // export var foo = ...
                    Decl::Var(v) => {
                        v.decls
                            .retain_mut(|decl| !self.should_remove_pat(&mut decl.name));
                        v.decls.is_empty()
                    }

                    // export enum Foo { }
                    Decl::TsEnum(_) => panic!("invalid code"),
                    // export using foo = ...
                    Decl::Using(_) => panic!("invalid code"),
                    // export interface Foo {}
                    Decl::TsInterface(_) => panic!("invalid code"),
                    // export type Foo = ...
                    Decl::TsTypeAlias(_) => panic!("invalid code"),
                    // export declare module "xxx" { }
                    Decl::TsModule(_) => panic!("invalid code"),
                }
            }

            ModuleDecl::ExportNamed(named) => {
                named.specifiers.retain(|exp| match exp {
                    // export * as foo from "source"
                    ExportSpecifier::Namespace(namespace) => {
                        !self.should_remove_module_export(&namespace.name)
                    }
                    // export { name, foo as bar };
                    // export { name, foo as bar } from "source";
                    ExportSpecifier::Named(named) => {
                        !self.should_remove_module_export(match &named.exported {
                            Some(exported) => exported,
                            None => &named.orig,
                        })
                    }
                    // export v from "source";
                    ExportSpecifier::Default(_) => panic!("invalid code"),
                });
                named.specifiers.is_empty()
            }

            // export default class {}
            // export default function () {}
            ModuleDecl::ExportDefaultDecl(_) => self.names.contains("default"),
            // export default <expr>;
            ModuleDecl::ExportDefaultExpr(_) => self.names.contains("default"),

            // import "source";
            // import { ... } from "source";
            ModuleDecl::Import(import) => {
                let old = import.specifiers.len();
                import.specifiers.retain(|x| match x {
                    // import { foo, foo as bar } from "source";
                    ImportSpecifier::Named(name) => !self.should_remove_ident(&name.local),
                    // import foo from "source";
                    ImportSpecifier::Default(def) => !self.should_remove_ident(&def.local),
                    // import * as foo from "source";
                    ImportSpecifier::Namespace(ns) => !self.should_remove_ident(&ns.local),
                });
                let now = import.specifiers.len();
                now != old && now == 0
            }

            // export * from "source";
            ModuleDecl::ExportAll(_) => false,

            // import rust = go;
            ModuleDecl::TsImportEquals(_) => panic!("invalid code"),
            // export = <expr>;
            ModuleDecl::TsExportAssignment(_) => panic!("invalid code"),
            // export as namespace Rust;
            ModuleDecl::TsNamespaceExport(_) => panic!("invalid code"),
        }
    }
}

impl VisitMut for RemoveVisitor {
    noop_visit_mut_type!();

    fn visit_mut_module_items(&mut self, n: &mut Vec<ModuleItem>) {
        n.retain_mut(|x| match x {
            ModuleItem::ModuleDecl(decl) => !self.should_remove_module_decl(decl),
            ModuleItem::Stmt(stmt) => match stmt {
                Stmt::Decl(decl) => match decl {
                    Decl::Class(c) => !self.should_remove_ident(&c.ident),
                    Decl::Fn(f) => !self.should_remove_ident(&f.ident),
                    Decl::Var(v) => {
                        v.decls
                            .retain_mut(|decl| !self.should_remove_pat(&mut decl.name));
                        !v.decls.is_empty()
                    }

                    Decl::Using(_) => panic!("invalid code"),
                    Decl::TsInterface(_) => panic!("invalid code"),
                    Decl::TsTypeAlias(_) => panic!("invalid code"),
                    Decl::TsEnum(_) => panic!("invalid code"),
                    Decl::TsModule(_) => panic!("invalid code"),
                },
                Stmt::Block(_) => true,
                Stmt::Empty(_) => true,
                Stmt::Debugger(_) => true,
                Stmt::With(_) => true,
                Stmt::Return(_) => true,
                Stmt::Labeled(_) => true,
                Stmt::Break(_) => true,
                Stmt::Continue(_) => true,
                Stmt::If(_) => true,
                Stmt::Switch(_) => true,
                Stmt::Throw(_) => true,
                Stmt::Try(_) => true,
                Stmt::While(_) => true,
                Stmt::DoWhile(_) => true,
                Stmt::For(_) => true,
                Stmt::ForIn(_) => true,
                Stmt::ForOf(_) => true,
                Stmt::Expr(_) => true,
            },
        });
    }
}

struct RefCounter<K> {
    map: HashMap<K, u32>,
    done: HashSet<K>,
}

impl<K> RefCounter<K>
where
    K: Hash + Eq + Clone + Debug,
{
    fn from_keys(keys: Vec<K>) -> Self {
        let mut map = HashMap::new();
        for key in keys {
            map.entry(key).or_insert(0);
        }
        let done = HashSet::new();
        Self { map, done }
    }

    fn count(&mut self, key: &K) {
        // println!("count: {:?}", key);
        self.map.entry(key.clone()).and_modify(|x| *x += 1);
    }

    fn discount(&mut self, key: &K, f: impl FnOnce(&K)) {
        // println!("discount: {:?}", key);
        if self.done.contains(key) {
            return;
        }

        if let Some(x) = self.map.get_mut(key) {
            if *x == 0 {
                // maybe this is force-removed
                return;
            }
            *x -= 1;
            if *x == 0 {
                self.mark(key);
                f(key);
            }
        }
    }

    fn mark(&mut self, key: &K) {
        self.done.insert(key.clone());
    }
}

impl RemoveVisitor {
    pub fn new(imports: ImportVisitor, removes: Vec<String>) -> Self {
        // analyze every keys refs counts
        let mut ref_counts = RefCounter::from_keys(imports.decl_refs.keys().cloned().collect());

        for (key, values) in &imports.decl_refs {
            for value in values {
                if key != value {
                    ref_counts.count(value);
                }
            }
        }
        for value in &imports.global_refs {
            ref_counts.count(value);
        }
        for (_, values) in &imports.export_refs {
            for value in values {
                ref_counts.count(value);
            }
        }
        for (_, value) in &imports.export_decls {
            ref_counts.count(value);
        }

        // repeatly mark decls as should remove
        let mut queue = VecDeque::<Id>::new();

        // force-remove
        // export function foo() {}
        for (name, id) in &imports.export_decls {
            if removes.contains(name) {
                ref_counts.mark(id);
                queue.push_back(id.clone());
            }
        }

        // soft-remove
        // export { foo }
        for (name, ids) in &imports.export_refs {
            if removes.contains(name) {
                for id in ids {
                    ref_counts.discount(id, |id| queue.push_back(id.clone()))
                }
            }
        }

        while let Some(decl) = queue.pop_front() {
            if let Some(ids) = imports.decl_refs.get(&decl) {
                for id in ids {
                    if id != &decl {
                        ref_counts.discount(id, |id| queue.push_back(id.clone()));
                    }
                }
            }
        }

        Self {
            names: removes.into_iter().collect(),
            ids: ref_counts.done,
        }
    }
}

#[derive(Deserialize, Default)]
struct RemoveExportsConfig {
    pub removes: Vec<String>,
}

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    metadata: TransformPluginProgramMetadata,
) -> Program {
    let config = metadata
        .get_transform_plugin_config()
        .and_then(|x| serde_json::from_str::<RemoveExportsConfig>(&x).ok())
        .unwrap_or_default();

    if let Program::Module(module) = &mut program {
        let mut import = ImportVisitor::default();
        module.visit_with(&mut import);
        let mut remove = RemoveVisitor::new(import, config.removes);
        module.visit_mut_with(&mut remove);
    }

    program
}
