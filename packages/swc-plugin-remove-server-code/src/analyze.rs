use std::collections::HashSet;

use swc_core::ecma::{
    ast::{Decl, Id, Ident, Lit, ModuleDecl, ModuleItem, ObjectPatProp, Pat, Stmt},
    visit::{noop_visit_type, Visit},
};

use crate::{counter::count_idents, crypto::hash_ref};

pub struct Loader {
    pub id: Id,
    pub name: String,
}

pub struct Action {
    pub id: Id,
    pub name: String,
    pub method: String,
}

#[derive(Clone)]
pub struct Relation {
    pub id: Id,
    pub depends: Vec<Id>,
}

impl Relation {
    fn from_ident(ident: &Ident) -> Self {
        Self {
            id: ident.to_id(),
            depends: Vec::new(),
        }
    }
}

#[derive(Default)]
pub struct AnalyzeVisitor {
    pub global: HashSet<Id>,
    pub loaders: Vec<Loader>,
    pub actions: Vec<Action>,
    pub relations: Vec<Relation>,
    pub middleware: Option<Relation>,
}

pub fn analyze_pat_relations(pat: &Pat, deps: &Vec<Id>) -> Vec<Relation> {
    match pat {
        Pat::Ident(x) => vec![Relation {
            id: x.id.to_id(),
            depends: deps.clone(),
        }],
        Pat::Array(x) => x
            .elems
            .iter()
            .flatten()
            .flat_map(|x| analyze_pat_relations(x, deps))
            .collect(),
        Pat::Rest(x) => analyze_pat_relations(&x.arg, deps),
        Pat::Object(x) => x
            .props
            .iter()
            .flat_map(|x| match x {
                ObjectPatProp::KeyValue(x) => analyze_pat_relations(&x.value, deps),
                ObjectPatProp::Assign(x) => {
                    let mut rest = count_idents(&x.value);
                    rest.extend(deps.iter().cloned());

                    vec![Relation {
                        id: x.key.to_id(),
                        depends: rest,
                    }]
                }
                ObjectPatProp::Rest(x) => analyze_pat_relations(&x.arg, deps),
            })
            .collect(),
        Pat::Assign(x) => {
            let mut rest = count_idents(&x.right);
            rest.extend(deps.iter().cloned());

            analyze_pat_relations(&x.left, &rest)
        }
        Pat::Invalid(_) => vec![],
        Pat::Expr(_) => vec![],
    }
}

impl Visit for AnalyzeVisitor {
    noop_visit_type!();

    fn visit_module_item(&mut self, n: &ModuleItem) {
        match n {
            ModuleItem::ModuleDecl(ModuleDecl::Import(decl)) => {
                for i in &decl.specifiers {
                    self.relations.push(Relation::from_ident(&i.local()));
                }
            }

            ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(decl)) => match &decl.decl {
                Decl::Var(decl) => {
                    for decl in &decl.decls {
                        let name = decl.name.as_ident().and_then(|x| Some(&x.id));

                        if let Some(name) = name {
                            if name.sym.to_string() == "middleware" {
                                self.middleware = Some(Relation {
                                    id: name.to_id(),
                                    depends: count_idents(&decl.init),
                                });
                                continue;
                            }

                            let call = decl.init.as_ref().and_then(|x| x.as_call());

                            if let Some(call) = call {
                                let func = call.callee.as_expr().and_then(|x| x.as_ident());
                                let sref = call
                                    .args
                                    .first()
                                    .and_then(|x| x.expr.as_lit())
                                    .and_then(|x| if let Lit::Str(x) = x { Some(x) } else { None })
                                    .and_then(|x| Some(x.value.to_string()));

                                if let Some(func) = func {
                                    let s = func.sym.to_string();

                                    if s == "loader$" {
                                        let sref = sref.unwrap_or_else(|| {
                                            // TODO: fix hash here
                                            hash_ref(&format!("loader-0-{}", name))
                                        });

                                        self.loaders.push(Loader {
                                            id: name.to_id(),
                                            name: sref,
                                        });

                                        continue;
                                    }

                                    if s == "action$"
                                        || s == "delete$"
                                        || s == "patch$"
                                        || s == "put$"
                                    {
                                        let sref = sref.unwrap_or_else(|| {
                                            // TODO: fix hash here
                                            hash_ref(&format!("action-0-{}", name))
                                        });

                                        self.actions.push(Action {
                                            id: name.to_id(),
                                            name: sref,
                                            method: match s.as_str() {
                                                "action$" => "POST".to_string(),
                                                "delete$" => "DELETE".to_string(),
                                                "patch$" => "PATCH".to_string(),
                                                "put$" => "PUT".to_string(),
                                                _ => unreachable!(),
                                            },
                                        });

                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }

                remains => self.global.extend(count_idents(remains)),
            },

            ModuleItem::Stmt(Stmt::Decl(decl)) => match decl {
                Decl::Class(x) => self.relations.push(Relation {
                    id: x.ident.to_id(),
                    depends: count_idents(&x.class),
                }),
                Decl::Fn(x) => self.relations.push(Relation {
                    id: x.ident.to_id(),
                    depends: count_idents(&x.function),
                }),
                Decl::Var(x) => {
                    for decl in &x.decls {
                        let deps = count_idents(&decl.init);
                        let relations = analyze_pat_relations(&decl.name, &deps);
                        self.relations.extend(relations);
                    }
                }

                remains => self.global.extend(count_idents(remains)),
            },

            remains => self.global.extend(count_idents(remains)),
        }
    }
}
