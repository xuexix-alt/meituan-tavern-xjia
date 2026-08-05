import { createHostFloorVisibilityController } from './hostFloorVisibility';

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(label);
}

class FakeRoot {
  readonly attrs = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }

  getAttribute(name: string) {
    return this.attrs.get(name) ?? null;
  }

  removeAttribute(name: string) {
    this.attrs.delete(name);
  }

  closest() {
    return this;
  }
}

class FakeStyle {
  id = '';
  textContent = '';
}

class FakeDocument {
  readonly roots = new Map<number, FakeRoot[]>();
  readonly styles = new Map<string, FakeStyle>();
  readonly body = null;
  readonly head = {
    appendChild: (style: FakeStyle) => {
      this.styles.set(style.id, style);
    },
  };

  querySelectorAll(selector: string) {
    const match = selector.match(/(?:mesid|data-message-index|data-message-id)='(\d+)'/);
    return match ? (this.roots.get(Number(match[1])) ?? []) : [];
  }

  getElementById(id: string) {
    return this.styles.get(id) ?? null;
  }

  createElement() {
    return new FakeStyle();
  }
}

const doc = new FakeDocument();
const carrier = new FakeRoot();
const firstCopy = new FakeRoot();
const secondCopy = new FakeRoot();
doc.roots.set(4, [carrier]);
doc.roots.set(5, [firstCopy, secondCopy]);

const controller = createHostFloorVisibilityController({
  documents: () => [doc as unknown as Document],
  carrierMessageId: () => 4,
  nextMessageId: () => 5,
});

controller.apply([4, 5]);
assert(!carrier.attrs.has('data-meituan-story-host-hidden'), '载体楼层不得隐藏');
assert(firstCopy.attrs.get('data-meituan-story-host-hidden') === 'true', '第一个宿主副本隐藏');
assert(secondCopy.attrs.get('data-meituan-story-host-hidden') === 'true', '重复宿主副本隐藏');

controller.replace([4]);
assert(!firstCopy.attrs.has('data-meituan-story-host-hidden'), 'replace 清理移除的楼层');
assert(!secondCopy.attrs.has('data-meituan-story-host-hidden'), 'replace 清理全部重复副本');

controller.reserve();
assert(firstCopy.attrs.get('data-meituan-story-host-hidden') === 'true', '创建前预留下一个楼层');

controller.destroy();
assert(!firstCopy.attrs.has('data-meituan-story-host-hidden'), '销毁清理由控制器拥有的属性');
assert(!secondCopy.attrs.has('data-meituan-story-host-hidden'), '销毁清理重复副本属性');

console.log('host floor visibility contract passed');
