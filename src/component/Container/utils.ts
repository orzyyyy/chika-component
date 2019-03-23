export const formatConfig = (config: Array<any>) => {
  let result: any = [];
  for (let item of config) {
    const {
      fname,
      controltype,
      fvalue,
      isvisiable,
      isadd,
      defaultvalue,
      editpageorderid,
      isnull,
      issearchfield,
      maxlen,
      minlen,
      foreigndata,
    } = item;
    result.push({
      type: (controlTypeEnums as any)[controltype],
      key: fname,
      name: fvalue,
      showInEdit: isadd,
      showInDetail: isvisiable,
      defaultValue: defaultvalue,
      orderInEdit: editpageorderid,
      orderInDetail: editpageorderid,
      isNull: isnull,
      isSearchItem: issearchfield,
      maxLength: maxlen,
      minLength: minlen,
      foreignData: foreigndata,
    });
  }
  return result;
};

const controlTypeEnums = {
  1: 'input',
  2: 'datePicker',
  3: 'select',
  5: 'checkbox',
  9: 'calendar',
  12: 'upload',
  14: 'mapPicker',
  99: 'label',
};

export const formatControls = (
  dataItem: any,
  config: Array<any>,
  primaryKey: string,
) => {
  let result = [];
  const keys = Object.keys(dataItem);
  for (let item of keys) {
    const targetItem = config.filter(target => target.key === item);
    if (targetItem.length) {
      const { key, showInDetail, type } = targetItem[0];
      if (!showInDetail) continue;
      const value = dataItem[key];
      const item = {
        ...targetItem[0],
        value: dataItem[key],
        templateOrder: dataItem.templateOrder,
        // when mapPicker change, dataSource will change target item by this.
        primaryValue: dataItem[primaryKey],
      };

      // handle with mapPicker
      if (type === 'mapPicker') {
        const latng = value.split('|');
        result.push({
          ...item,
          lng: latng[0],
          lat: latng[1],
          address: latng[2],
        });
      } else {
        result.push(item);
      }
    }
  }
  return result;
};
