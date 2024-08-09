use analyze::AnalyzeVisitor;
use remove::RemoveVisitor;
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{ast::Program, visit::VisitWith};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

mod analyze;
mod counter;
mod crypto;
mod remove;

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    _metadata: TransformPluginProgramMetadata,
) -> Program {
    let module = program.as_mut_module().unwrap();

    let mut analyze_visitor = AnalyzeVisitor::default();
    module.visit_with(&mut analyze_visitor);

    let mut remove_visitor = RemoveVisitor::from_analyze(analyze_visitor);
    module.visit_mut_with(&mut remove_visitor);

    program
}
