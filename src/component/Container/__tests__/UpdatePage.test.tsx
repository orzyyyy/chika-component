import React from 'react';
import { mount, shallow } from 'enzyme';
import 'nino-cli/scripts/setup';
import { originConfig } from '../../../mock/config';
// import { originDataSource } from '../../../mock/dataSource';
import { formatControls, formatConfig } from '../utils';
const Config = formatConfig(originConfig);
let UpdatePage;
switch (process.env.LIB_DIR) {
  case 'lib':
    UpdatePage = require('../../../../lib/component/Container/UpdatePage')
      .default;
    break;
  default:
    UpdatePage = require('../UpdatePage').default;
    break;
}

describe('UpdatePage', () => {
  it('render correctly', () => {
    const wrapper = shallow(
      <UpdatePage
        dataSource={formatControls(null, Config, 'dam_cd')}
        status="add"
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('should render correctly when status is add', () => {
    const wrapper = mount(
      <UpdatePage
        dataSource={formatControls(null, Config, 'dam_cd')}
        status="add"
      />,
    );
    const listContent = wrapper.find('.am-list-content');
    expect(listContent.length).toBe(9);
    expect(listContent.at(0).text()).toBe('pjnm');
    expect(listContent.at(1).text()).toBe('dam_cd');
    expect(listContent.at(2).text()).toBe('datePicker');
    expect(listContent.at(3).text()).toBe('select');
    expect(listContent.at(4).text()).toBe('calendar');
    expect(listContent.at(5).text()).toBe('起始时间');
    expect(listContent.at(6).text()).toBe('结束时间');
    expect(listContent.at(7).text()).toBe('mapPicker');
  });

  it('should update state correctly when status is add', () => {
    const dataSource = formatControls(null, Config, 'dam_cd');
    const wrapper = mount(<UpdatePage dataSource={dataSource} status="add" />);
    let transformedDataSource = [];
    for (let item of dataSource) {
      transformedDataSource.push({
        ...item,
        error: false,
        message: '',
      });
    }
    expect(wrapper.state().form).toEqual(transformedDataSource);
    // input
    wrapper
      .find('input')
      .at(1)
      .simulate('change', { target: { value: 'test' } });
    expect(wrapper.state().form[1].value).toBe('test');
    // datePicker
    wrapper
      .find('ListItem')
      .at(2)
      .simulate('click');
    wrapper.find('.am-picker-popup-header-right').simulate('click');
    expect(wrapper.state().form[2].value.getDate()).toBe(new Date().getDate());
    // select
    wrapper
      .find('ListItem')
      .at(3)
      .simulate('click');
    wrapper.find('.am-picker-popup-header-right').simulate('click');
    expect(wrapper.state().form[3].value).toBe('value1');
    // checkbox
    wrapper
      .find('.am-accordion-header')
      .first()
      .simulate('click');
    wrapper
      .find('.am-checkbox-input')
      .at(2)
      .simulate('change');
    expect(wrapper.state().form[4].value).toBe('checkbox3');
    // calendar
    // upload
    // mapPicker
    // they are hard to test
  });
});
