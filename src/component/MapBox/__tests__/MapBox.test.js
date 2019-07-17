import React from 'react';
import { shallow } from 'enzyme';
let MapBox;
switch (process.env.LIB_DIR) {
  case 'lib':
    MapBox = require('../../../../lib/component/MapBox').default;
    break;
  case 'dist':
    MapBox = require('../../../../dist/lib/MapBox').default;
    break;
  default:
    MapBox = require('..').default;
    break;
}

describe('MapBox', () => {
  it('render correctly', () => {
    const wrapper = shallow(<MapBox />);
    expect(wrapper).toMatchSnapshot();
  });
});
