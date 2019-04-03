import React from 'react';
import { mount, shallow } from 'enzyme';
import 'nino-cli/scripts/setup';
let Drawer;
switch (process.env.LIB_DIR) {
  case 'lib':
    Drawer = require('../../../../lib/component/Drawer').default;
    break;
  default:
    Drawer = require('..').default;
    break;
}

describe('Drawer', () => {
  it('render correctly', () => {
    const wrapperShow = shallow(<Drawer visible={true}>test</Drawer>);
    const wrapperHide = shallow(<Drawer visible={false}>test</Drawer>);
    expect(wrapperShow).toMatchSnapshot();
    expect(wrapperHide).toMatchSnapshot();
  });

  it('when operate drawer is clicked, onChange should to be called', () => {
    const onChange = jest.fn();
    const wrapper = mount(
      <Drawer visible={true} onChange={onChange} direction="right">
        test
      </Drawer>,
    );
    wrapper.find('.operate-drawer').simulate('click');
    expect(onChange).toBeCalled();
  });
});
