/**
 * A workaround to reliably run global teardown after all tests (especially in ui mode and VSCode)
 * See: https://github.com/microsoft/playwright/issues/33193
 * See: https://github.com/microsoft/playwright/issues/37524
 */
import globalTeardown from './teardown';

export default class {
  async onEnd() {
    await globalTeardown();
  }
}
