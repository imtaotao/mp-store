describe('comp', () => {
  simulate.load({
    id: 'view',
    tagName: 'wx-view',
    template: '<div><slot/></div>'
  }); 

  let childId = simulate.load({
      tagName: 'xxx',
      template: '<view><slot/></view>', // 直接使用全局组件
  });

  let id = simulate.load({
      template: '<child>123</child>',
      usingComponents: {
        'child': childId, // 声明要使用的组件，传入组件 id
      },
      behaviors: [behavior],
      options: {
          classPrefix: 'xxx',

      },
  });
})