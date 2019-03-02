import EmberObject from '@ember/object';
import EmberHooksMixin from 'ember-hooks/mixins/ember-hooks.ts';
import { module, test } from 'qunit';

module('Unit | Mixin | ember-hooks', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let EmberHooksObject = EmberObject.extend(EmberHooksMixin);
    let subject = EmberHooksObject.create();
    assert.ok(subject);
  });
});
