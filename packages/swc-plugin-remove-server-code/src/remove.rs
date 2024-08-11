use std::collections::{HashMap, HashSet, VecDeque};

use swc_core::{
    common::DUMMY_SP,
    ecma::{
        ast::{
            ArrowExpr, BlockStmtOrExpr, CallExpr, Callee, Decl, Expr, ExprOrSpread, Id, Ident,
            ImportDecl, ImportNamedSpecifier, ImportSpecifier, ModuleDecl, ModuleExportName,
            ModuleItem, ObjectPatProp, Pat, Stmt, Str,
        },
        visit::{noop_visit_mut_type, VisitMut},
    },
};

use crate::analyze::{Action, AnalyzeVisitor, Loader, Relation};

fn analyze_pat_idents(pat: &Pat) -> Vec<Id> {
    match pat {
        Pat::Ident(x) => vec![x.to_id()],
        Pat::Array(x) => x
            .elems
            .iter()
            .flatten()
            .flat_map(|x| analyze_pat_idents(x))
            .collect(),
        Pat::Rest(x) => analyze_pat_idents(&x.arg),
        Pat::Object(x) => x
            .props
            .iter()
            .flat_map(|x| match x {
                ObjectPatProp::KeyValue(x) => analyze_pat_idents(&x.value),
                ObjectPatProp::Assign(x) => vec![x.key.id.to_id()],
                ObjectPatProp::Rest(x) => analyze_pat_idents(&x.arg),
            })
            .collect(),
        Pat::Assign(x) => analyze_pat_idents(&x.left),
        Pat::Invalid(_) => vec![],
        Pat::Expr(_) => vec![],
    }
}

#[derive(Default)]
pub struct RemoveVisitor {
    removes: HashSet<Id>,
    loaders: HashMap<Id, Loader>,
    actions: HashMap<Id, Action>,
    additional: HashSet<Id>,
}

impl VisitMut for RemoveVisitor {
    noop_visit_mut_type!();

    fn visit_mut_module_items(&mut self, n: &mut Vec<ModuleItem>) {
        let mut has_loader = false;
        let mut has_action = false;

        let use_loader = Ident::from("_useLoader");
        let use_action = Ident::from("_useAction");

        n.retain_mut(|n| match n {
            ModuleItem::ModuleDecl(ModuleDecl::Import(decl)) => {
                let is_empty = decl.specifiers.is_empty();
                decl.specifiers
                    .retain(|x| !self.removes.contains(&x.local().to_id()));
                is_empty || !decl.specifiers.is_empty()
            }

            ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(decl)) => match &mut decl.decl {
                Decl::Var(decl) => {
                    decl.decls.retain_mut(|x| {
                        if let Some(name) = x.name.as_ident().and_then(|x| Some(x.id.to_id())) {
                            if let Some(loader) = self.loaders.get(&name) {
                                // x.init = () => _useLoader("name");
                                x.init = Some(Box::new(Expr::Arrow(ArrowExpr {
                                    span: DUMMY_SP,
                                    params: Vec::new(),
                                    body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::Call(
                                        CallExpr {
                                            span: DUMMY_SP,
                                            callee: Callee::Expr(Box::new(Expr::Ident(
                                                use_loader.clone(),
                                            ))),
                                            args: vec![ExprOrSpread::from(Expr::from(
                                                loader.name.clone(),
                                            ))],
                                            type_args: None,
                                        },
                                    )))),
                                    is_async: false,
                                    is_generator: false,
                                    type_params: None,
                                    return_type: None,
                                })));

                                has_loader = true;
                                return true;
                            }

                            if let Some(action) = self.actions.get(&name) {
                                // x.init = () => _useAction("name", "method");
                                x.init = Some(Box::new(Expr::Arrow(ArrowExpr {
                                    span: DUMMY_SP,
                                    params: Vec::new(),
                                    body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::Call(
                                        CallExpr {
                                            span: DUMMY_SP,
                                            callee: Callee::Expr(Box::new(Expr::Ident(
                                                use_action.clone(),
                                            ))),
                                            args: vec![
                                                ExprOrSpread::from(Expr::from(action.name.clone())),
                                                ExprOrSpread::from(Expr::from(
                                                    action.method.clone(),
                                                )),
                                            ],
                                            type_args: None,
                                        },
                                    )))),
                                    is_async: false,
                                    is_generator: false,
                                    type_params: None,
                                    return_type: None,
                                })));

                                has_action = true;
                                return true;
                            }

                            // shake middleware & paths
                            if self.additional.contains(&name) {
                                return false;
                            }
                        }

                        true
                    });

                    !decl.decls.is_empty()
                }
                _ => true,
            },
            ModuleItem::Stmt(Stmt::Decl(decl)) => match decl {
                Decl::Class(x) => !self.removes.contains(&x.ident.to_id()),
                Decl::Fn(x) => !self.removes.contains(&x.ident.to_id()),
                Decl::Var(x) => {
                    x.decls.retain(|x| {
                        !analyze_pat_idents(&x.name)
                            .iter()
                            .all(|x| self.removes.contains(x))
                    });

                    !x.decls.is_empty()
                }
                _ => true,
            },
            _ => true,
        });

        if has_loader || has_action {
            let mut specifiers = vec![];
            if has_loader {
                specifiers.push(ImportSpecifier::Named(ImportNamedSpecifier {
                    span: DUMMY_SP,
                    local: use_loader,
                    imported: Some(ModuleExportName::Ident(Ident::from("useLoader"))),
                    is_type_only: false,
                }));
            }
            if has_action {
                specifiers.push(ImportSpecifier::Named(ImportNamedSpecifier {
                    span: DUMMY_SP,
                    local: use_action,
                    imported: Some(ModuleExportName::Ident(Ident::from("useAction"))),
                    is_type_only: false,
                }));
            }

            n.insert(
                0,
                ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                    span: DUMMY_SP,
                    specifiers,
                    src: Box::new(Str::from("@biliblitz/blitz")),
                    type_only: false,
                    with: None,
                    phase: Default::default(),
                })),
            );
        }
    }
}

impl From<AnalyzeVisitor> for RemoveVisitor {
    fn from(value: AnalyzeVisitor) -> Self {
        let removes = resolve_remove_relations(value.relations, value.global);
        let loaders = value
            .loaders
            .into_iter()
            .map(|x| (x.id.clone(), x))
            .collect();
        let actions = value
            .actions
            .into_iter()
            .map(|x| (x.id.clone(), x))
            .collect();
        let additional = value.additional;

        Self {
            removes,
            loaders,
            actions,
            additional,
        }
    }
}

/// Get all relation ids that should be remove
fn resolve_remove_relations(relations: Vec<Relation>, global: HashSet<Id>) -> HashSet<Id> {
    let mut queue: VecDeque<HashSet<Id>> = VecDeque::new();
    let mut relations = relations
        .into_iter()
        .map(|x| (x.id, x.depends))
        .collect::<HashMap<_, _>>();

    for id in global {
        if let Some(depends) = relations.remove(&id) {
            queue.push_back(depends);
        }
    }

    while let Some(depends) = queue.pop_front() {
        for id in depends {
            if let Some(depends) = relations.remove(&id) {
                queue.push_back(depends);
            }
        }
    }

    relations.into_keys().collect()
}

#[cfg(test)]
mod test {
    use std::collections::{HashMap, HashSet};

    use swc_core::{
        atoms::Atom,
        common::SyntaxContext,
        ecma::{transforms::testing::test_inline, visit::as_folder},
    };

    use crate::{
        analyze::{Action, Loader},
        remove::RemoveVisitor,
    };

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::new(),
            loaders: HashMap::new(),
            actions: HashMap::new(),
            additional: HashSet::new()
        }),
        remove_visitor_should_not_change_console_log,
        r#"console.log("hello world");"#,
        r#"console.log("hello world");"#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::from([(Atom::from("x"), SyntaxContext::from_u32(0))]),
            loaders: HashMap::new(),
            actions: HashMap::new(),
            additional: HashSet::new()
        }),
        remove_visitor_should_remove_removes,
        r#"const x = 114514, y = 1919810;"#,
        r#"const y = 1919810;"#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::from([
                (Atom::from("x"), SyntaxContext::from_u32(0)),
                (Atom::from("y"), SyntaxContext::from_u32(0)),
            ]),
            loaders: HashMap::new(),
            actions: HashMap::new(),
            additional: HashSet::new()
        }),
        remove_visitor_should_remove_objects,
        r#"const { x = 233, z: { y } } = ref();"#,
        r#""#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::from([
                (Atom::from("x"), SyntaxContext::from_u32(0)),
                (Atom::from("y"), SyntaxContext::from_u32(0)),
            ]),
            loaders: HashMap::new(),
            actions: HashMap::new(),
            additional: HashSet::new()
        }),
        remove_visitor_should_keep_objects,
        r#"const { x = 233, z: { y }, ...o } = ref();"#,
        r#"const { x = 233, z: { y }, ...o } = ref();"#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::from([
                (Atom::from("a"), SyntaxContext::from_u32(0)),
                (Atom::from("b"), SyntaxContext::from_u32(0)),
                (Atom::from("c"), SyntaxContext::from_u32(0)),
                (Atom::from("d"), SyntaxContext::from_u32(0)),
                (Atom::from("e"), SyntaxContext::from_u32(0)),
            ]),
            loaders: HashMap::new(),
            actions: HashMap::new(),
            additional: HashSet::new()
        }),
        remove_visitor_should_remove_imports,
        r#"
        import { a } from "vue";
        import { a as b } from "vue";
        import c from "vue";
        import * as d from "vue";
        import { e, f } from "vue";
        import "./style.css";
        "#,
        r#"
        import { f } from "vue";
        import "./style.css";
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::new(),
            loaders: HashMap::from([(
                (Atom::from("useRandom"), SyntaxContext::from_u32(0)),
                Loader {
                    id: (Atom::from("useRandom"), SyntaxContext::from_u32(0)),
                    name: String::from("abcdefg")
                }
            )]),
            actions: HashMap::new(),
            additional: HashSet::new()
        }),
        remove_visitor_should_replace_loaders,
        r#"export const useRandom = loader$(() => Math.random());"#,
        r#"
        import { useLoader as _useLoader } from "@biliblitz/blitz";
        export const useRandom = () => _useLoader("abcdefg");
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::new(),
            loaders: HashMap::new(),
            actions: HashMap::from([(
                (Atom::from("useRandom"), SyntaxContext::from_u32(0)),
                Action {
                    id: (Atom::from("useRandom"), SyntaxContext::from_u32(0)),
                    name: String::from("abcdefg"),
                    method: String::from("POST")
                }
            )]),
            additional: HashSet::new()
        }),
        remove_visitor_should_replace_actions,
        r#"export const useRandom = action$(() => Math.random());"#,
        r#"
        import { useAction as _useAction } from "@biliblitz/blitz";
        export const useRandom = () => _useAction("abcdefg", "POST");
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(RemoveVisitor {
            removes: HashSet::new(),
            loaders: HashMap::new(),
            actions: HashMap::new(),
            additional: HashSet::from([
                (Atom::from("paths"), SyntaxContext::from_u32(0)),
                (Atom::from("middleware"), SyntaxContext::from_u32(0)),
            ])
        }),
        remove_visitor_should_remove_additional,
        r#"
        export const middleware = middleware$(async (c, next) => { next(); });
        export const paths = () => ["alice", "bob"];
        export const other = 114514;
        "#,
        r#"
        export const other = 114514;
        "#
    );
}
