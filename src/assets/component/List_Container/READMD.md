## 通用列表
- 自定义模版
- 内容可编辑

## 示例

* 第一步
   ``` bash
   npm install sc-component-mobile --save
   ```

* 第二步
    * 在模板文件里写html
    ``` html
      render(){
          <div className='item'>
              <div>
                  <span>测试字段1：</span>
                  <span data-key='RNAME'>RNAME</span>
              </div>
              <div>
                  <span>测试字段2：</span>
                  <span data-key='REALNAME'>REALNAME</span>
              </div>
              <div>
                  <span>测试字段3：</span>
                  <span data-key='U_ADDRESS'>U_ADDRESS</span>
              </div>
              <div>
                  <span>测试字段4：</span>
                  <span data-key='CREATETIME' format='YYYY-MM-DD'>CREATETIME</span>
              </div>
          </div>
      }
    ``` 
    
    * 效果图  
    ![img](https://github.com/zy410419243/react-mobile-component/blob/master/src/assets/component/List_Container/demo_img/first.jpg)
    
* 第三步

    觉着没问题以后再加点细节
    ``` html
       import {Container} from 'sc-component-mobile'

       config = {
           tcid: 1620,
           menuid: 315,
           pageSize: 10,
           // UserId: 1,
           CellPhone: '13900000000',
           requestUrl: 'http://www.baidu.com',
           requestParams: {
               test1: 'test1',
               test2: 'test2',
               test3: 'test3',
           },
           requestMethod: 'GET',
       }
       
       render(){
          <Container config={this.config}>
              <div className='item' bind>
                  <div>
                      <span>测试字段1：</span>
                      <span data-key='RNAME'>RNAME</span>
                  </div>
                  <div>
                      <span>测试字段2：</span>
                      <span data-key='REALNAME'>REALNAME</span>
                  </div>
                  <div>
                      <span>测试字段3：</span>
                      <span data-key='U_ADDRESS'>U_ADDRESS</span>
                  </div>
                  <div>
                      <span>测试字段4：</span>
                      <span data-key='CREATETIME' format='YYYY-MM-DD'>CREATETIME</span>
                  </div>
              </div>
          </Container>
       }
    ```
    
    * 效果图  
    ![img](https://github.com/zy410419243/react-mobile-component/blob/master/src/assets/component/List_Container/demo_img/second.jpg)
    
## 最终效果图
  ![img](https://github.com/zy410419243/react-mobile-component/blob/master/src/assets/component/List_Container/demo_img/demo_list_container.gif)  
  这里图跟gif版本没对上，不过大概就是这么个意思了。  
  至于gif里的报错...其实就是演示下功能而已，别太在意后端在干嘛...

## API
| 参数 | 说明 | 类型 | 默认值 |
| :------: | ----- | :------: | :------: |
| decimalcount | 浮点数保留位数 | Number | 0 |
| url | true时会用第三方接口，默认以tcid和menuid的形式请求数据 | Boolean |  false |
| bind | 长按事件绑定的地方。上面的例子是绑在整块模版上，于是长按模板就能触发事件 | Boolean | true |
| format | 字段为日期时，格式化字符串。绑定的节点得是底层，就是没子标签的那种 | string | YYYY-MM-DD |
| data-key | 物理字段名 | string，需要和接口中的字段对应 | 无 |
| unit | 单位，用在列表页 | string | 无 |
| bindKey | 如果data-key被占用了，可以把这个属性放到Container上，    ``` <Container bindKey='data-test' />``` ,于是现在绑定物理字段名的key变成data-test了 | string | 'data-key' |
| config | 配置，详见下方说明 | {} | 无 |


# config
| 参数 | 说明 | 类型 | 默认值 |
| :------: | ----- | :------: | :------: |
| tcid | 主表id，获取配置和数据 | Number | -1 |
| menuid | 权限id，跟菜单没多大关系，只是需要一个参数来确定长按弹框里显示啥而已 | Number | -1 |
| pageSize | 每页显示多少条，后期会去掉这个参数，换成读主表配置中的参数 | int | 2 |
| UserId | 跟CellPhone一样是确定权限用的。比如给这个用户配置了修改的权限，不传这个参数依旧是不能编辑的，传了才能；当然如果没配置权限的话这个可以不用管。因为各种app外壳获得方式不一样，如果有需要的话自行传入 | Number | -1 |
| CellPhone | 跟UserId二选一即可 | string || Number | null |
| RequestUrl | 非标准接口地址 | string | 无 |
| RequestParams | 非标准接口地址参数，这里可以直接固定搜索参数，可以用在一级页面跳转到二级页面，用带过来的参数搜索。搜索时需要加上AddSearchField字段表示搜索，否则搜索会失效 | object | {} |
| RequestMethod | 非标准接口请求方式 | string | GET |



## 已实现的控件类型
| ControlType | 说明 |
| :---: | :---: |
| 1 | 文本框 |
| 2 | 单日期选择 |
| 3 | 下拉框 |
| 5 | 复选框 |
| 99 | label，基本就用在详情页 |
