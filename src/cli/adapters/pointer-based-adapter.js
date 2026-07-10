'use strict';

const PlatformAdapter = require('./base');
const {
  buildHostNativePointer,
  inspectHostNativePointer,
  planHostNativePointerRemoval,
  planHostNativePointerSync,
} = require('./host-native-pointer');

class PointerBasedAdapter extends PlatformAdapter {
  get pointerPath() {
    throw new Error(`${this.constructor.name} must define pointerPath`);
  }

  get pointerHostLabel() {
    return this.id;
  }

  get pointerInitCommand() {
    return `spec-first init --${this.id}`;
  }

  get pointerFrontmatter() {
    return '';
  }

  get pointerExpectedPrefix() {
    return this.pointerFrontmatter;
  }

  buildPointerContent() {
    return buildHostNativePointer({
      hostLabel: this.pointerHostLabel,
      initCommand: this.pointerInitCommand,
      frontmatter: this.pointerFrontmatter,
    });
  }

  inspectPointerRuntime(projectRoot) {
    return inspectHostNativePointer(projectRoot, this.pointerPath, {
      hostId: this.id,
      hostLabel: this.pointerHostLabel,
      expectedPrefix: this.pointerExpectedPrefix,
    });
  }

  planPointerRuntimeFilesSync(projectRoot) {
    return planHostNativePointerSync(
      projectRoot,
      this.pointerPath,
      this.buildPointerContent(),
    );
  }

  planPointerRuntimeFilesRemoval(projectRoot) {
    return planHostNativePointerRemoval(projectRoot, this.pointerPath);
  }

  planRuntimeFilesSync(projectRoot) {
    return this.planPointerRuntimeFilesSync(projectRoot);
  }

  planRuntimeFilesRemoval(projectRoot) {
    return this.planPointerRuntimeFilesRemoval(projectRoot);
  }

  inspectRuntimeFiles(projectRoot) {
    return [this.inspectPointerRuntime(projectRoot)];
  }
}

module.exports = PointerBasedAdapter;
