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
} from 'antd-mobile';
const { CheckboxItem } = Checkbox;
import Upload from '../Upload';
import { formatDate } from '../../util';
import { PropsGoToMaxBox } from './core';

export type UpdatePageStatus = 'add' | 'update';
export type ValidTypes = {
  maxLength: number | string;
  minLength: number | string;
  isNull: boolean;
};
export type ControlTypes =
  | 'input'
  | 'datePicker'
  | 'select'
  | 'checkbox'
  | 'calendar'
  | 'upload'
  | 'mapPicker'
  | 'label';
export interface UpdatePageProps {
  onBack?: () => void;
  dataSource: Array<any>;
  status: UpdatePageStatus;
  onMapBoxChange?: (item: PropsGoToMaxBox) => void;
}
export type CalendarItem = {
  calendarVisible: boolean;
  currentCalendarItem: {
    key: string;
    config: any;
  };
};
export type UpdatePageState = {
  form: Array<any>;
} & CalendarItem;

const CalendarDefaultValue: CalendarItem = {
  calendarVisible: false,
  currentCalendarItem: {
    key: '',
    config: {},
  },
};

export default class UpdatePage extends Component<
  UpdatePageProps,
  UpdatePageState
> {
  constructor(props: UpdatePageProps) {
    super(props);

    this.state = {
      ...CalendarDefaultValue,
      form: this.initDefaultValue(props.dataSource),
    };
  }

  initDefaultValue = (dataSource: any) => {
    for (let item of dataSource) {
      item.error = false;
      item.message = '';
    }
    return dataSource;
  };

  validValue = (value: any, rule: ValidTypes) => {
    // isNull = false => it shouldn't be null
    const { maxLength, minLength, isNull } = rule;
    if (!isNull && !value) {
      return { error: true, message: '该值不能为空' };
    }
    if (maxLength && value.toString().length > maxLength) {
      return {
        error: true,
        message: `不能超过${maxLength}个字符`,
      };
    }
    if (minLength && value.toString().length < minLength) {
      return {
        error: true,
        message: `不能少于${minLength}个字符`,
      };
    }
    return {
      error: false,
      message: '',
    };
  };

  checkValue = (value: any, item: any) => {
    const { type } = item;
    let tip = {};
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
        value = `${formatDate(startDateTime)},${formatDate(endDateTime)}`;
        rest = CalendarDefaultValue;
        break;

      case 'upload':
        const fileList = JSON.parse(this.state.form[index].value || '[]');
        fileList.push({
          url: value.url,
          id: value.id,
          name: value.name,
        });
        value = fileList.toString();
        break;

      default:
        tip = this.validValue(value, item);
        break;
    }

    this.state.form[index] = Object.assign(this.state.form[index], {
      value,
      ...tip,
    });
    this.setState({
      form: this.state.form,
      ...rest,
    });
  };

  renderEditItem = () => {
    const { props, state } = this;
    const { status, onMapBoxChange } = props;
    const prefixCls = `update-page-${status}`;
    let element = [];
    for (let item of state.form) {
      const { type, name, key, foreignData } = item;
      switch (type) {
        case 'input':
          element.push(
            <List.Item
              // key={`${prefixCls}-input-item-${i}`}
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
              // key={`${prefixCls}-data-picker-${i}`}
              onChange={(value: Date) => this.checkValue(value, item)}
              value={item.value ? new Date(item.value) : new Date()}
            >
              <List.Item arrow="horizontal">{name}</List.Item>
            </DatePicker>,
          );
          break;

        case 'select':
          element.push(
            <Picker
              // key={`${prefixCls}-select-${i}`}
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
            <Accordion
            // key={`${prefixCls}-checkbox-${i}`}
            >
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
          const dateArr = (item.value && item.value.split(',')) || ['', ''];
          element.push(
            <React.Fragment
            // key={`${prefixCls}-calendar-${i}`}
            >
              <List.Item
                extra={dateArr[0] ? '' : '请选择'}
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
              <List.Item extra={dateArr[0]}>起始时间</List.Item>
              <List.Item extra={dateArr[1]}>结束时间</List.Item>
            </React.Fragment>,
          );
          break;

        case 'upload':
          element.push(
            <Accordion
            // key={`${prefixCls}-upload-${i}`}
            >
              <Accordion.Panel header={name}>
                <Upload
                  fileList={item.value as any}
                  onChange={file => this.checkValue(file, item)}
                />
              </Accordion.Panel>
            </Accordion>,
          );
          break;

        case 'mapPicker':
          if (status === 'add') {
            element.push(
              <List.Item
                extra="请选择"
                // key={`${prefixCls}-map-picker-add-${i}`}
                arrow="horizontal"
                // onClick={() => this.setState({ calendarVisible: true })}
              >
                {name}
              </List.Item>,
            );
          } else if (status === 'update') {
            const latlng = (item.value && item.value.split('|')) || [];
            const lng = latlng[0];
            const lat = latlng[1];
            element.push(
              <List.Item
                // key={`${prefixCls}-map-picker-address-${i}`}
                arrow="horizontal"
                onClick={() =>
                  onMapBoxChange && onMapBoxChange({ lat, lng, key })
                }
                extra={latlng.length > 2 ? latlng[2] : '查看'}
              >
                地址
              </List.Item>,
            );
            element.push(
              <List.Item
                // key={`${prefixCls}-map-picker-lng-${i}`}
                extra={parseFloat(lng).toFixed(6)}
              >
                经度
              </List.Item>,
            );
            element.push(
              <List.Item
                // key={`${prefixCls}-map-picker-lat-${i}`}
                extra={parseFloat(lat).toFixed(6)}
              >
                纬度
              </List.Item>,
            );
          }
          break;

        default:
          break;
      }
    }
    return element;
  };

  render = () => {
    const { onBack } = this.props;
    const { calendarVisible, currentCalendarItem } = this.state;
    return (
      <>
        <List>
          {this.renderEditItem() as any}
          <List.Item>
            <Button
              type="primary"
              // onClick={this.save}
              inline
              style={{ marginRight: 4, width: 'calc(50% - 4px)' }}
            >
              保存
            </Button>
            <Button inline onClick={onBack} style={{ width: '50%' }}>
              返回
            </Button>
          </List.Item>
        </List>
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
      </>
    );
  };
}
