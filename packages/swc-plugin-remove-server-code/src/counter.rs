use std::collections::HashSet;

use swc_core::ecma::{
    ast::{Id, Ident},
    visit::{noop_visit_type, Visit, VisitWith},
};

#[derive(Default)]
pub struct CounterVisitor {
    identifiers: HashSet<Id>,
}

impl Visit for CounterVisitor {
    noop_visit_type!();

    fn visit_ident(&mut self, n: &Ident) {
        self.identifiers.insert(n.to_id());
    }
}

pub fn count_idents<T: VisitWith<CounterVisitor>>(t: &T) -> Vec<Id> {
    let mut visitor = CounterVisitor::default();
    t.visit_with(&mut visitor);
    visitor.identifiers.into_iter().collect()
}
