import React, { Component } from 'react';
import {
  List,
  Button,
  InputItem,
  DatePicker,
  Picker,
  Accordion,
  Checkbox,
  Toast,
  Calendar,
  Drawer,
} from 'antd-mobile';
const { CheckboxItem } = Checkbox;
import { formatDate } from '../../util';

const CalendarDefaultValue: CalendarItem = {
  calendarVisible: false,
  currentCalendarItem: {
    key: '',
    config: {},
  },
};
export type CalendarItem = {
  calendarVisible: boolean;
  currentCalendarItem: {
    key: string;
    config: any;
  };
};
export interface SearchBarProps {
  dataSource: Array<any>;
}
export type SearchBarState = {
  form: Array<any>;
} & CalendarItem;

export default class SearchBar extends Component<
  SearchBarProps,
  SearchBarState
> {
  state: SearchBarState = {
    form: [],
    ...CalendarDefaultValue,
  };

  static getDerivedStateFromProps(
    prevProps: SearchBarProps,
    prevState: SearchBarState,
  ) {
    if (prevProps.dataSource.length !== 0 && prevState.form.length === 0) {
      return { form: prevProps.dataSource };
    }
    return null;
  }

  checkValue = (value: any, item: any) => {
    const { type } = item;
    let rest = {};
    const index = this.state.form.findIndex(f => f.key === item.key);
    switch (type) {
      case 'checkbox':
        let stateValue;
        stateValue = this.state.form[index].value || '';
        let checkboxSet = new Set();
        if (stateValue) {
          checkboxSet = new Set(stateValue.split(','));
          checkboxSet.has(value)
            ? checkboxSet.delete(value)
            : checkboxSet.add(value);
        } else {
          checkboxSet.add(value);
        }
        value = Array.from(checkboxSet).toString();
        break;

      case 'calendar':
        const { startDateTime, endDateTime } = value;
        value = [formatDate(startDateTime), formatDate(endDateTime)];
        rest = CalendarDefaultValue;
        break;

      case 'upload':
        const fileList = this.state.form[index].value || [];
        fileList.push({
          url: value.url,
          id: value.id,
          name: value.name,
        });
        value = fileList;
        break;

      default:
        break;
    }

    this.state.form[index] = Object.assign(this.state.form[index], {
      value,
    });
    this.setState({
      form: this.state.form,
      ...rest,
    });
  };

  renderSidebar = () => {
    const { state } = this;
    const prefixCls = `search-bar`;
    let element = [];
    for (let item of state.form) {
      const { type, name, key, foreignData, id } = item;
      switch (type) {
        case 'input':
          element.push(
            <List.Item
              key={`${prefixCls}-input-item-${id}`}
              extra={
                <InputItem
                  clear
                  placeholder="请输入"
                  style={{ textAlign: 'right' }}
                  onErrorClick={() => Toast.fail(item.message)}
                  onChange={(value: string) => this.checkValue(value, item)}
                  value={item.value}
                  error={item.error}
                />
              }
            >
              {name}
            </List.Item>,
          );
          break;

        case 'datePicker':
          element.push(
            <DatePicker
              key={`${prefixCls}-data-picker-${id}`}
              onChange={(value: Date) => this.checkValue(value, item)}
              value={item.value}
            >
              <List.Item arrow="horizontal">{name}</List.Item>
            </DatePicker>,
          );
          break;

        case 'select':
          element.push(
            <Picker
              key={`${prefixCls}-select-${id}`}
              data={foreignData}
              cols={1}
              onChange={(value: any) => this.checkValue(value[0], item)}
              value={item.value ? [item.value] : []}
            >
              <List.Item arrow="horizontal">{name}</List.Item>
            </Picker>,
          );
          break;

        case 'checkbox':
          element.push(
            <Accordion key={`${prefixCls}-checkbox-${id}`}>
              <Accordion.Panel header={name}>
                <List>
                  {foreignData.map(
                    (
                      checkboxItem: { value: string; label: string },
                      i: number,
                    ) => {
                      const stateValue =
                        (item.value && item.value.split(',')) || [];
                      return (
                        <CheckboxItem
                          key={`${prefixCls}-checkbox-item-${i}`}
                          checked={stateValue.includes(checkboxItem.value)}
                          onChange={() =>
                            this.checkValue(checkboxItem.value, item)
                          }
                        >
                          {checkboxItem.label}
                        </CheckboxItem>
                      );
                    },
                  )}
                </List>
              </Accordion.Panel>
            </Accordion>,
          );
          break;

        case 'calendar':
          element.push(
            <React.Fragment key={`${prefixCls}-calendar-${id}`}>
              <List.Item
                extra={item.value[0] ? '' : '请选择'}
                arrow="horizontal"
                onClick={() =>
                  this.setState({
                    calendarVisible: true,
                    currentCalendarItem: { type, key, config: item },
                  })
                }
              >
                {name}
              </List.Item>
              <List.Item extra={item.value[0]}>起始时间</List.Item>
              <List.Item extra={item.value[1]}>结束时间</List.Item>
            </React.Fragment>,
          );
          break;

        default:
          break;
      }
    }
    return element;
  };

  render() {
    const { calendarVisible, currentCalendarItem } = this.state;
    const sidebar = (
      <React.Fragment>
        {this.renderSidebar()}
        <List>
          <List.Item>
            <Button type="primary" onClick={() => console.log(this.state.form)}>
              确定
            </Button>
          </List.Item>
        </List>
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <Drawer
          sidebar={sidebar}
          position="left"
          // open={true}
          sidebarStyle={{ width: '77%', background: '#fff' }}
          overlayStyle={{ backgroundColor: 'transpent' }}
          enableDragHandle
        >
          <React.Fragment />
        </Drawer>
        <Calendar
          visible={calendarVisible}
          onCancel={() => {
            this.setState({ calendarVisible: false });
          }}
          pickTime
          onConfirm={(startDateTime: Date, endDateTime: Date) =>
            this.checkValue(
              { startDateTime, endDateTime },
              currentCalendarItem.config,
            )
          }
        />
      </React.Fragment>
    );
  }
}
