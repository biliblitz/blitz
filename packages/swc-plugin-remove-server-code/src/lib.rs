use analyze::AnalyzeVisitor;
use remove::RemoveVisitor;
use serde::Deserialize;
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{ast::Program, visit::VisitWith};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

mod analyze;
mod counter;
mod crypto;
mod remove;

#[derive(Debug, Deserialize)]
struct RemoveServerCodeConfig {
    #[serde(default)]
    salt: String,
}

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    metadata: TransformPluginProgramMetadata,
) -> Program {
    let config = metadata
        .get_transform_plugin_config()
        .and_then(|x| serde_json::from_str::<RemoveServerCodeConfig>(&x).ok())
        .unwrap();

    let module = program.as_mut_module().unwrap();

    let mut analyze_visitor = AnalyzeVisitor::new(config.salt);
    module.visit_with(&mut analyze_visitor);

    let mut remove_visitor = RemoveVisitor::from(analyze_visitor);
    module.visit_mut_with(&mut remove_visitor);

    program
}
