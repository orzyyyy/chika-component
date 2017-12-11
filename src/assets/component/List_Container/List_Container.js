import React from 'react'

import Button from '../Button/Button'
import {Modal,DatePicker,List,InputItem,Drawer,NavBar,Icon,Picker,Toast} from 'antd-mobile'
const operation = Modal.operation;
import {createForm} from 'rc-form'

import './css/List_Container.css'
import {extend} from '../../../data/DeepClone'

/* 块状通用列表（移动端） */
class List_Container extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            currentState: 0, // 页面所处位置
            edit_config: [], // 新增/编辑页面配置
            loading: false, // 新增/编辑页面加载状态
            input_datas: {}, // 新增/编辑页面文本框集合
            select_datas: {}, // 新增/编辑页面下拉框集合
            date_datas: {}, // 日期集合
            search_field_open: false, // 搜索面板是否打开
            search_param: {}, // 搜索参数
            detail_config: [], // 详情页配置
            // detail_item: {}, // 单个详情页数据
        }

        this.children = [] // 遍历模板根据数据渲染 reactNode
        this.listDatas = [] // 列表数据 object
        this.power = [] // 权限字符串 string
        this.mainKey = '' // 搜索主键 string
        this.config = [] // 配置
        this.pageType = 'list' // 当前页面状态，列表页为list，编辑页为edit,详情页为detail,新增页为add
    }

    componentDidMount = () => {
        this.bind_touch_direction(this.content, direction => {
            switch(direction){
                case 'toLeft':
                    this.handle_search_change();
                break;
            }
        });

        this.bind_touch_direction(this.edit_content, direction => {
            if(this.pageType == 'detail')
                switch(direction){
                    case 'toLeft':
                        this.handle_detail_pagination('next');
                    break;

                    case 'toRight':
                        this.handle_detail_pagination('last');
                    break;
                }
        });

        this.get_config();
    }

    // 绑定 判断滑动方向 事件
    bind_touch_direction = (ref, method) => {
        let startX, startY, endX, endY;
        ref.addEventListener('touchstart', e => {
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
        });

        ref.addEventListener('touchend', e => {
            endX = e.changedTouches[0].pageX;
            endY = e.changedTouches[0].pageY;

            let direction = this.getDirection(startX, startY, endX, endY);

            method(direction);
        });
    }

    //根据起点终点返回方向
    getDirection(startX, startY, endX, endY) {
        let angx = endX - startX;
        let angy = endY - startY;
        let result = '我一直站在此处没有动，等你买橘回来给我付车费';
 
        // 如果滑动距离太短
        if (Math.abs(angx) < 25 && Math.abs(angy) < 25) {
            return result;
        }
 
        let angle = Math.atan2(angy, angx) * 180 / Math.PI;
        if (angle >= -135 && angle <= -45) {
            result = 'toTop';
        } else if (angle > 45 && angle < 135) {
            result = 'toDown';
        } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
            result = 'toLeft';
        } else if (angle >= -45 && angle <= 45) {
            result = 'toRight';
        }
 
        return result;
    }

    // 请求配置
    get_config = () => {
        const {tbid = -1} = this.props;
        T.ajax({
            key: 'getConfig',
            f: 'json',
            data: {tbid},
            success: (result) => {
                const {power, config} = result;

                // 根据权限判断是否显示列表
                let flag = false;
                for(let item of power){
                    if(item == 'Select') flag = true;
                }
                // 需要权限不足的提示 mark
                if(!flag) return;

                this.power = power;
                this.config = config;

                /* 
                    搜索主键是列表点到详情页请求数据的那个唯一标识
                */
                for(let item of config){
                    // 判断是不是搜索主键，暂时按只有一个算
                    if(item.IsKey === 'True') this.mainKey = item.FName;
                }

                this.search();
            }
        });
    }

    // 展示列表请求数据
    search = () => {
        let {search_param} = this.state;
        T.ajax({
            key: 'search',
            f: 'json',
            data: search_param,
            success: (result) => {
                const {data} = result;

                this.listDatas = data;
                // 详情页排序
                // for(let i = 0; i < this.listDatas.length; i++){
                //     let item = this.listDatas[i];
                //     item.detail_order = i;
                // }

                this.children = [];
                for(let item of data){
                    let children = extend({}, this.props.children);
                    this.travel_children(children, item, item[this.mainKey]);
                    this.children.push(children);
                }

                // 搜索后关闭面板 mark
                this.state.search_field_open ? this.handle_search_change() : this.setState();
                // Object.keys(search_param).length === 0 ? this.setState() : this.handle_search_change();
            }
        })
    }


    /* 处理详情页数据排序，用于过渡动画
        先找到对应value所在的index，然后根据index加入order属性
        left: order * -100%
    */
    handle_detail_datas = (datas, value) => {
        let index = -1;
        for(let i = 0; i < datas.length; i++){
            let item = datas[i];
            if(item[this.mainKey] == value){
                index = i;
                break;
            }
        }

        for(let i = 0, order = -index; i < datas.length; i++, order++){
            let item = datas[i];
            item.detail_order = order;
        }

        return datas;
    }

    /* 
        初始化新增/编辑页面
        mainValue为搜索主键对应的值，mainKey在this里

        处理逻辑有冗余 mark
    */
    handle_item_edit = (mainValue, type) => {
        let {input_datas, select_datas, date_datas, edit_config, detail_config, currentState} = this.state;

        this.pageType = type;

        this.listDatas = this.handle_detail_datas(this.listDatas, mainValue);

        for(let item of this.listDatas){
            if(item[this.mainKey] == mainValue){
                for(let jtem of this.config){
                    let {FName, FValue} = jtem;
                    
                    for(let key in item){
                        if(key == FName && jtem.IsAdd === 'True'){ // IsVisiable是在列表中的显隐，现在由模板绑定字段控制。这里的是编辑页面
                            switch(type){
                                case 'edit': 
                                    // 初始化控件值
                                    switch(jtem.ControlType){
                                        case '1': 
                                            input_datas[key] = item[key];
                                        break;
                                        
                                        case '2':
                                            date_datas[key] = new Date(item[key]);
                                        break;
                                        
                                        case '3':
                                            select_datas[key] = item[key];
                                        break;
                                    }
                                break;

                                case 'add':
                                    input_datas = {};
                                    select_datas = {};
                                    date_datas = {};
                                break;

                                // case 'detail':
                                //     detail_item = item;
                                // break;
                            }

                            // 初始化配置属性
                            let element = Object.assign({}, jtem, {
                                ControlType: type == 'detail' ? '99' : jtem.ControlType,
                                FName: key,
                            });
                            type == 'detail' ? detail_config.push(element) : edit_config.push(element);
                        }
                    }
                }
            }
        }

        // 切换页面时回到顶部
        window.scrollTo(0, 1);
        this.setState({currentState: -1, input_datas, select_datas, date_datas, edit_config});
    }

    /* 递归模版，填入数据
        可能有更好的处理方法，不需要深拷贝  mark
    */
    travel_children = (children, item, mainKey) => {
        const {bindKey = 'data-key'} = this.props;

        React.Children.map(children, child => {
            let {bind,format} = child.props;
            /* 绑定点击事件
                模版中所谓的head就是每块元素的最顶层标签
            */
            if(bind){
                // 长按菜单
                let timer = null;

                /* 查看详情
                    这里没必要用fastclick */
                child.props.onClick = e => {
                    this.handle_item_edit(mainKey, 'detail');
                }

                child.props.onTouchStart = e => {
                    // 引入swiper用
                    // e.preventDefault();
                    timer = setTimeout(() => {
                        let opera = [];
                        for(let item of this.power){
                            switch(item){
                                case 'Add': 
                                    opera.push({text: '新增', onPress: () => this.handle_item_edit(mainKey, 'add')});
                                break;

                                case 'Del':
                                    opera.push({text: '删除', onPress: this.delete});
                                break;

                                case 'Update':
                                    opera.push({text: '修改', onPress: () => this.handle_item_edit(mainKey, 'edit')});
                                break;
                            }
                        }
                        operation(opera);
                    }, 800);
                }

                // 滑动时停止计时，不然滑着滑着弹菜单，这就很尴尬了
                child.props.onTouchMove = () => {
                    clearTimeout(timer);
                }

                child.props.onTouchEnd = () => {
                    clearTimeout(timer);
                }
            }

            /* 处理时间格式 */
            if(format){
                let key = child.props[bindKey];
                let date = T.clock(item[key]).fmt(format);
                child.props.children = date;
            }

            if(child.props[bindKey] && !format){
                let key = child.props[bindKey];
                child.props.children = item[key];
            }else{
                if(child.props && typeof(child.props.children) === 'object'){
                    this.travel_children(child.props.children, item, mainKey);
                }
            }
        })
    }

    save = () => {
        this.props.form.validateFields({ force: true }, (error) => {
            if (!error) {
                // 提交数据
                console.log(this.props.form.getFieldsValue());
                // 刷新列表
                this.search();
                // 过渡动画，重置数据
                this.reset();
            } else {
                // Toast.info(this.props.form.getFieldError(FName).join('、'), 1.5, null, true);
            }
        });
    }

    // 详情返回列表
    back = () => {
        this.reset('detail');
    }

    reset = (type) => {
        let {currentState} = this.state;
        // 切换页面时回到顶部
        window.scrollTo(0, 1);

        this.setState({currentState: 0}, () => {
            this.pageType = 'list';
            // 500ms为过渡动画效果
            setTimeout(() => {
                this.state.edit_config = [];
                this.state.detail_config = [];
                // this.state.detail_item = {};

                this.setState();
            }, 500);
        });
    }

    delete = () => {
        console.log('删除被点击了')
    }

    handle_form_error = (FName) => {
        Toast.info(this.props.form.getFieldError(FName).join('、'), 1.5, null, true);
    }

    handle_input = (e, item, key) => {
        this.state[item][key] = e;
        this.setState();
    }

    handle_select = (e, item, key) => {
        // 内部数据结构处理，数组需要转化，需要级联选择 mark
        this.state[item][key] = e[0];
        this.setState();
    }

    handle_date = (e, item, key, format) => {
        this.state[item][key] = T.clock(e).fmt(format);
        this.setState();
    }

    // 验证
    // validate_value = (rule, value, callback, item) => {
    //     if (value && value.length > 2) {
    //         callback();
    //     } else {
    //         callback(new Error('test'));
    //     }
    // }

    // 预处理 
    handle_input_value = (value, item) => {
        if(value === '') return value;
        // 判断是否是数字
        let reg = /^\d+$|^\d+\.\d+$/g;
        // 保留小数位数
        if(reg.test(value) && item.DecimalCount){
            value = parseFloat(value).toFixed(item.DecimalCount);
        }

        return value;
    }

    //1. 文本框 2. 时间控件（日期：2012-01-01） 3. 下拉框 4. 单选框 5. 多选框
    //6. 数值控件 7. TextArea 8.隐藏域hidden 9.时间控件（时间：2012-01-01 00:00:00）
    //10.行政区划Ztree(支持多个) 11.部门Ztree(支持多个) 12.单、多附件上传 13.可输可选 14.地图坐标选取
    /* 搜索、详情、新增/编辑，控件类型都在这里处理 */
    handle_ControlType = (item, type, detail_item) => {
        const {input_datas, select_datas, date_datas, search_param} = this.state;
        const {FName, FValue, DateFormat = 'YYYY-MM-DD', ForeignData, DefaultValue, IsNull, Regular, MaxLen, MinLen} = item;
        const {getFieldProps, getFieldError} = this.props.form;

        if(type == 'search' && item.IsSearchField !== 'True') return null;
        
        /* 因为搜索条件也是要用到这里的，
            如果不判断type，form的key会重复绑定，导致第二次编辑无法输入 */
        let element = [];
        let option = {};
        switch (item.ControlType){
            case '1': // 文本框
                option = {
                    onChange: e => this.handle_input(e, 'input_datas', FName),
                    /* 设置默认值 */
                    initialValue: this.handle_input_value(input_datas[FName], item) || this.handle_input_value(DefaultValue, item),
                    rules: [
                        {required: IsNull === 'True' ? false : true, message: '该值不能为空'},
                        {pattern: Regular, message: '该值不符合规则'},
                        {max: MaxLen, message: `长度太长，最多为${MaxLen}个字符`},
                        {min: MinLen, message: `长度太短，最少为${MinLen}个字符`},
                        // {validator: (rule, value, callback) => this.validate_value(rule, value, callback, item)},
                    ],
                }
                element = type == 'search' ? (
                    <InputItem onChange={e => this.handle_input(e, 'search_param', FName)} value={search_param[FName]} clear placeholder='请输入'>{FValue}</InputItem>
                ) : (
                    <InputItem {...getFieldProps(FName, option)} error={!!getFieldError(FName)} onErrorClick={() => this.handle_form_error(FName)} clear placeholder='请输入'>{FValue}</InputItem>
                );
            break;

            // 时间没赋默认值 mark
            case '2': // 时间控件
                option = {
                    onChange: date => this.handle_date(date, 'date_datas', FName, DateFormat),
                    initialValue: date_datas[FName] || DefaultValue || new Date(),
                    rules: [
                        {required: IsNull === 'True' ? false : true, message: '该值不能为空'},
                    ],
                };
                element = type == 'search' ? (
                    <DatePicker value={search_param[FName]} onChange={date => this.handle_date(date, 'search_param', FName, DateFormat)} format={date => (T.clock(date).fmt(DateFormat))}>
                        <List.Item arrow='horizontal'>{FValue}</List.Item>
                    </DatePicker>
                ) : (
                    <DatePicker {...getFieldProps(FName, option)} error={!!getFieldError(FName)} onErrorClick={() => this.handle_form_error(FName)}>
                        <List.Item arrow='horizontal'>{FValue}</List.Item>
                    </DatePicker>
                );
            break;

            case '3': // 下拉框
                option = {
                    onChange: value => this.handle_select(value, 'select_datas', FName),
                    initialValue: [select_datas[FName]],
                    rules: [
                        {required: IsNull === 'True' ? false : true, message: '该值不能为空'},
                    ],
                };
                element = type == 'search' ? (
                    <Picker extra='请选择' data={ForeignData} cols={1} onChange={value => this.handle_select(value, 'search_param', FName)} value={[search_param[FName]]}>
                        <List.Item arrow='horizontal'>{FValue}</List.Item>
                    </Picker>
                ) : (
                    <Picker extra='请选择' data={ForeignData} cols={1} {...getFieldProps(FName, option)} error={!!getFieldError(FName)} onErrorClick={() => this.handle_form_error(FName)}>
                        <List.Item arrow='horizontal'>{FValue}</List.Item>
                    </Picker>
                );
            break;

            case '99': // label，基本就是给详情页用的
                element = (
                    <List.Item extra={this.handle_input_value(detail_item[FName], item)}>{FValue}</List.Item>
                );
            break;
        }
        
        return element;
    }

    handle_search_change = (...args) => {
        this.setState({search_field_open: !this.state.search_field_open});
    }

    // 详情页 上一条/下一条
    handle_detail_pagination = (type) => {
        switch(type){
            case 'next': // 上一条
                for(let i = 0; i < this.listDatas.length; i++){
                    let item = this.listDatas[i];
                    item.detail_order--;
                }
            break;

            case 'last': // 下一条
                for(let i = 0; i < this.listDatas.length; i++){
                    let item = this.listDatas[i];
                    item.detail_order++;
                }
            break;
        }
        this.setState();
    }

    render() {
        const {children, config} = this;
        const {currentState, edit_config, search_field_open, detail_config} = this.state;
        const {height = document.documentElement.clientHeight || document.body.clientHeight} = this.props;

        let sidebar = (
            <List>
                <NavBar icon={<Icon type='search' />}>查询条件</NavBar>
                {
                    config.map(item => {
                        return this.handle_ControlType(item, 'search');
                    })
                }
                <List.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type='primary' onChange={this.search} style={{width: 110,height: 30,marginRight: 30}}>确定</Button>
                        <Button type='simple' onChange={this.handle_search_change} style={{width: 110,height: 30}}>返回</Button>
                    </div>
                </List.Item>
            </List>
        );

        /* 详情页上一条数据 */
        let last = (
            <div className='extend-drawer left' onClick={() => this.handle_detail_pagination('last')} style={{display: this.pageType == 'detail' ? '' : 'none'}}>
                <img src='./assets/List_Container/arrow-left.png' />
            </div>
        );

        /* 详情页下一条数据 */
        let next = (
            <div className='extend-drawer right' onClick={() => this.handle_detail_pagination('next')} style={{display: this.pageType == 'detail' ? '' : 'none'}}>
                <img src='./assets/List_Container/arrow-right.png' />
            </div>
        );

        /* 新增/修改都是这个 */
        let edit_content = (
            <List>
                {
                    edit_config.map(item => {
                        return this.handle_ControlType(item, 'edit');
                    })
                }

                <List.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type='primary' onChange={this.save} style={{width: 110,height: 30,marginRight: 30}}>保存</Button>
                        <Button type='simple' onChange={this.back} style={{width: 110,height: 30}}>返回</Button>
                    </div>
                </List.Item>
            </List>
        );

        /* 详情页 */
        let detail_content = (
            <div>
                {
                    this.listDatas.map(jtem => {
                        return (
                            <List className='detail-content' style={{left: (jtem.detail_order * 100 + '%')}}>
                                {
                                    detail_config.map(item => {
                                        return this.handle_ControlType(item, 'detail', jtem);
                                    })
                                }

                                <List.Item>
                                    <div style={{textAlign: 'center'}}>
                                        <Button type='simple' onChange={this.back} style={{width: 110,height: 30}}>返回上一级</Button>
                                    </div>
                                </List.Item>
                            </List>
                        );
                    })
                }
            </div>
        );

        return (
            <div className='List_Container' style={{minHeight: height}}>
                {/* 触发搜索的方块 */}
                <div className='extend-drawer right' onClick={this.handle_search_change} style={{display: search_field_open || this.pageType != 'list' ? 'none' : ''}}>
                    <img src='./assets/List_Container/arrow-left.png' />
                </div>
                {/* 搜索面板 */}
                <Drawer open={search_field_open} onOpenChange={this.handle_search_change} className='search-drawer' sidebar={sidebar} position='right' />

                {/* 模板渲染 */}
                <div className='content' style={{left: currentState * 100 + '%'}} ref={ref => this.content = ref}>
                    {children}
                </div>

                {/* 新增/修改/详情 */}
                <div className='edit-content' style={{left: (currentState + 1) * 100 + '%'}} ref={ref => this.edit_content = ref}>
                    {last}
                    {this.pageType == 'detail' ? detail_content : edit_content}
                    {next}
                </div>
            </div>
        )
    }
}

export default createForm()(List_Container);