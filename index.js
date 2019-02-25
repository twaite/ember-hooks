'use strict';
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var path = require('path');

module.exports = {
  name: require('./package').name,
  included() {
    this._super.included.apply(this, arguments);
    this.import('node_modules/clone/clone.js');
  },

  treeForVendor(vendorTree) {
    var cloneTree = new Funnel(path.dirname(require.resolve('clone/clone.js')), {
      files: ['clone.js'],
    });

    return new MergeTrees([vendorTree, cloneTree]);
  },
};
