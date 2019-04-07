import React from 'react';
import { mount } from 'enzyme';
import 'nino-cli/scripts/setup';
let Swiper;
switch (process.env.LIB_DIR) {
  case 'lib':
    Swiper = require('../../../../lib/component/Swiper').default;
    break;
  case 'dist':
    Swiper = require('../../../../dist/lib/Swiper').default;
    break;
  default:
    Swiper = require('..').default;
    break;
}

describe('Swiper', () => {
  it('render correctly', () => {
    const wrapper = mount(
      <Swiper wrapperHeight={500} duration={0.7} sensibility={1}>
        test
      </Swiper>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('getChildHeight should work correctly', () => {
    const wrapper = mount(
      <Swiper wrapperHeight={500} duration={0.7} sensibility={1}>
        test
      </Swiper>,
    ).instance();
    wrapper.getChildHeight();
    expect(wrapper.bottomHeight).toBe(-456);
    expect(wrapper.scrollerHeight).toBe(0);
  });
});
