import React from 'react'

import {Modal, DatePicker, List, InputItem, Drawer, Picker, Toast, Button, Calendar, ActivityIndicator, PullToRefresh} from 'antd-mobile'
const operation = Modal.operation;
import {createForm} from 'rc-form'

import './css/List_Container.css'
import {extend} from '../../../data/DeepClone'

/* 块状通用列表（移动端） */
class List_Container extends React.Component {
    constructor(props) {
        super(props);

        let {tcid} = props;
        this.state = {
            currentState: 0, // 页面所处位置
            edit_config: [], // 新增/编辑页面配置
            loading: true, // 新增/编辑页面加载状态
            search_field_open: false, // 搜索面板是否打开
            detail_config: [], // 详情页配置
            calendar_visible: false, // 选择时段是否显示
            edit_param: {}, // 新增/编辑页用的数据
            search_param: { // 搜索参数
                TCID: tcid,
                PageSize: 10,
                PageIndex: 1,
            },
            search_loading: false, // 搜索时加载
            container_height: ClientHeight, // 容器高度，用于滑动加载
        }

        this.children = [] // 遍历模板根据数据渲染 reactNode
        this.listDatas = [] // 列表数据 object
        this.power = [] // 权限字符串 string
        this.mainKey = '' // 搜索主键 string
        this.config = [] // 配置
        this.pageType = 'list' // 当前页面状态，列表页为list，编辑页为edit,详情页为detail,新增页为add
        this.detail_next = false // 详情页是否还有下一页，true表示还有下一页
        this.detail_last = false // 详情页是否还有上一页，true表示还有上一页
        this.calendar_key = '' // 时段搜索参数名
    }

    componentDidMount = () => {
        // 绑定搜索面板滑动事件
        this.bind_touch_direction(this.content, direction => {
            switch(direction){
                case 'toLeft':
                    this.handle_search_change();
                break;
            }
        });

        // 绑定详情页点击及滑动事件
        this.bind_touch_direction(this.edit_content, direction => {
            if(this.pageType == 'detail'){
                let {detail_next, detail_last} = this.handle_detail_next();
                switch(direction){
                    case 'toLeft':
                        if(detail_next)
                            this.handle_detail_pagination('next', detail_next);
                    break;

                    case 'toRight':
                        if(detail_last)
                            this.handle_detail_pagination('last', detail_last);
                    break;
                }
            }
        });

        // start
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
        const {tcid = -1, menuid = -1} = this.props;

        this.setState({loading: true});
        T.ajax({
            key: 'getConfig',
            f: 'json',
            data: {tcid, menuid},
            success: (result) => {
                // 无论如何都会有查看的权限
                let {power = 'Select', tablefieldconfig} = result.data;
                power = power.split(',');

                this.power = power;
                this.config = tablefieldconfig;

                /* 
                    搜索主键是列表点到详情页请求数据的那个唯一标识
                */
                for(let item of tablefieldconfig){
                    // 判断是不是搜索主键，暂时按只有一个算
                    if(item.iskey) this.mainKey = item.fname;
                }

                this.search();
            }
        });
    }

    // 展示列表请求数据
    search = (AddSearchField) => {
        let {search_param, search_loading} = this.state;

        !search_loading ? this.setState({search_loading: true}) : null;

        let param = Object.assign({}, search_param, AddSearchField);

        T.ajax({
            key: 'search',
            f: 'json',
            // method: 'POST',
            data: param,
            success: (result) => {
                let {list} = result.data;

                // 分页
                // 新增/编辑页返回后也会调这方法，于是数据翻倍
                this.listDatas = [...this.listDatas, ...list];
                this.children = [];
                
                for(let i = 0; i < this.listDatas.length; i++){
                    let item = this.listDatas[i];

                    // 详情页排序
                    item.detail_order = i;
                    item.index = i;

                    // 渲染模版
                    let children = extend({}, this.props.children);
                    this.travel_children(children, item, item[this.mainKey]);
                    this.children.push(children);
                }

                // 更新数据后重置高度
                // this.state.container_height -= this.swiper.offsetTop;

                // 搜索后关闭面板 mark
                this.state.search_field_open ? this.handle_search_change() : this.setState({loading: false, search_loading: false});
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
        let {edit_config, detail_config, currentState, edit_field, edit_param} = this.state;

        this.pageType = type;

        this.listDatas = this.handle_detail_datas(this.listDatas, mainValue);

        for(let item of this.listDatas){
            if(item[this.mainKey] == mainValue){
                for(let jtem of this.config){
                    let {fname, fvalue} = jtem;
                    
                    for(let key in item){
                        if(key == fname && jtem.isadd){ // IsVisiable是在列表中的显隐，现在由模板绑定字段控制。这里的是编辑页面
                            switch(type){
                                case 'edit': 
                                    edit_param[key] = item[key];
                                break;

                                case 'add':
                                    edit_param = {};
                                break;
                            }

                            // 初始化配置属性
                            let element = Object.assign({}, jtem, {
                                controltype: type == 'detail' ? 99 : jtem.controltype,
                                fname: key,
                            });
                            type == 'detail' ? detail_config.push(element) : edit_config.push(element);
                        }
                    }
                }
            }
        }

        // 切换页面时回到顶部
        // window.scrollTo(0, 1);
        this.setState({currentState: -1, edit_param, edit_config, detail_config});
    }

    /* 递归模版，填入数据
        可能有更好的处理方法，不需要深拷贝  mark
    */
    travel_children = (children, item, mainKey) => {
        const {bindKey = 'data-key'} = this.props;

        React.Children.map(children, child => {
            let {bind, format} = child.props;
            /* 绑定点击事件
                模版中所谓的head就是每块元素的最顶层标签
            */
            if(bind){
                // 长按菜单
                let timer = null;

                /* 查看详情 */
                child.props.onClick = e => {
                    this.handle_item_edit(mainKey, 'detail');
                }

                child.props.onTouchStart = e => {
                    // 引入swiper用
                    // e.preventDefault();
                    timer = this.power.length == 1 && this.power[0] == 'Select' ? null : setTimeout(() => {
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

                // 滑动时停止计时，不然滑着滑着弹菜单，很尴尬
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
                child.props.children = item[key] ? T.clock(item[key]).fmt(format) : null;
            }

            if(child.props[bindKey] && !format){
                let key = child.props[bindKey];
                child.props.children = item[key];
            }else{
                if(child.props && child.props.children instanceof Array){
                    this.travel_children(child.props.children, item, mainKey);
                }
            }
        })
    }

    save = () => {
        this.props.form.validateFields({force: true}, (error, value) => {
            if (!error) {
                let {search_param} = this.state;
                let result = this.props.form.getFieldsValue();
                console.log(result);
                // console.log(this.state.search_param)

                // 刷新列表
                this.search({AddSearchField: true, PageIndex: 1});
                // 过渡动画，重置数据
                this.reset();
            } else {
                // Toast.info(this.props.form.getFieldError(fname).join('、'), 3, null, true);
                Toast.fail('ヽ(ｏ`皿′ｏ)ﾉ 上面肯定有地方输错了，点行末标志能知道你错哪了', 3, null, false);
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
        // window.scrollTo(0, 1);

        this.setState({currentState: 0}, () => {
            this.pageType = 'list';
            // 500ms为过渡动画效果
            setTimeout(() => {
                this.state.edit_config = [];
                this.state.detail_config = [];

                this.setState();
            }, 500);
        });
    }

    delete = () => {
        console.log('删除被点击了')
    }

    handle_form_error = (fname) => {
        Toast.info(this.props.form.getFieldError(fname).join('、'), 3, null, false);
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

    handle_date = (date, item, key, format) => {
        this.state[item][key] = T.clock(date).fmt(format);
        // this.state[item][key] = date;
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
        if(reg.test(value) && item.decimalcount){
            value = parseFloat(value).toFixed(item.decimalcount);
        }

        return value;
    }

    //1. 文本框 2. 时间控件（日期：2012-01-01） 3. 下拉框 4. 单选框 5. 多选框
    //6. 数值控件 7. TextArea 8.隐藏域hidden 9.时间控件（时间：2012-01-01 00:00:00）
    //10.行政区划Ztree(支持多个) 11.部门Ztree(支持多个) 12.单、多附件上传 13.可输可选 14.地图坐标选取
    /* 搜索、详情、新增/编辑，控件类型都在这里处理 */
    handle_ControlType = (item, type, detail_item) => {
        const {search_param, edit_field, edit_param} = this.state;
        const {fname, fvalue, dateformat = 'YYYY-MM-DD', foreigndata, defaultvalue, isnull, regular, maxlen, minlen} = item;
        const {getFieldProps, getFieldError} = this.props.form;

        if(type == 'search' && !item.issearchfield) return null;
        
        /* 因为搜索条件也是要用到这里的，
            如果不判断type，form的key会重复绑定，导致第二次编辑无法输入 */
        let element = [];
        let option = {};

        switch (item.controltype){
            case 1: // 文本框
                option = {
                    onChange: e => this.handle_input(e, 'edit_param', fname),
                    /* 设置默认值 */
                    initialValue: this.handle_input_value(edit_param[fname], item) || this.handle_input_value(defaultvalue, item),
                    rules: [
                        {required: !!isnull, message: '该值不能为空'},
                        {pattern: regular, message: '该值不符合规则'},
                        {max: maxlen, message: `长度太长，最多为${maxlen}个字符`},
                        {min: minlen, message: `长度太短，最少为${minlen}个字符`},
                        // {validator: (rule, value, callback) => this.validate_value(rule, value, callback, item)},
                    ],
                }
                element = type == 'search' ? (
                    <InputItem onChange={e => this.handle_input(e, 'search_param', fname)} value={search_param[fname]} clear placeholder='请输入'>{fvalue}</InputItem>
                ) : (
                    <InputItem {...getFieldProps(fname, option)} error={!!getFieldError(fname)} onErrorClick={() => this.handle_form_error(fname)} clear placeholder='请输入'>{fvalue}</InputItem>
                );
            break;

            // 时间没赋默认值 mark
            case 2: // 时间控件
                option = {
                    onChange: date => this.handle_date(date, 'edit_param', fname, dateformat),
                    initialValue: edit_param[fname] || defaultvalue,
                    rules: [
                        {required: !!isnull, message: '该值不能为空'},
                    ],
                };
                element = type == 'search' ? (
                    <DatePicker value={search_param[fname] ? new Date(search_param[fname]) : null} onChange={date => this.handle_date(date, 'search_param', fname, dateformat)} format={date => (T.clock(date).fmt(dateformat))}>
                        <List.Item arrow='horizontal'>{fvalue}</List.Item>
                    </DatePicker>
                ) : (
                    <DatePicker {...getFieldProps(fname, option)} error={!!getFieldError(fname)} onErrorClick={() => this.handle_form_error(fname)}>
                        <List.Item arrow='horizontal'>{fvalue}</List.Item>
                    </DatePicker>
                );
            break;

            case 3: // 下拉框
                option = {
                    onChange: value => this.handle_select(value, 'edit_param', fname),
                    initialValue: [edit_param[fname]],
                    rules: [
                        {required: !!isnull, message: '该值不能为空'},
                    ],
                };
                element = type == 'search' ? (
                    <Picker extra='请选择' data={foreigndata} cols={1} onChange={value => this.handle_select(value, 'search_param', fname)} value={[search_param[fname]]}>
                        <List.Item arrow='horizontal'>{fvalue}</List.Item>
                    </Picker>
                ) : (
                    <Picker extra='请选择' data={foreigndata} cols={1} {...getFieldProps(fname, option)} error={!!getFieldError(fname)} onErrorClick={() => this.handle_form_error(fname)}>
                        <List.Item arrow='horizontal'>{fvalue}</List.Item>
                    </Picker>
                );
            break;

            case 9: // 时段
                option = {
                    rules: [
                        {required: !!isnull, message: '该值不能为空'},
                    ]
                }
                this.calendar_key = fname;
                let flag = !!search_param[fname + 'Begin'];

                element = type == 'search' ? (
                    <div>
                        <List.Item extra={flag ? null : '请选择'} arrow='horizontal' onClick={() => this.setState({calendar_visible: true})}>{fvalue}</List.Item>
                        <List.Item extra={flag ? T.clock(search_param[fname + 'Begin']).fmt('YY-MM-DD hh:mm').toLocaleString() : null} style={{display: flag ? '' : 'none'}}>{fvalue}开始时间</List.Item>
                        <List.Item extra={flag ? T.clock(search_param[fname + 'End']).fmt('YY-MM-DD hh:mm').toLocaleString() : null} style={{display: flag ? '' : 'none'}}>{fvalue}结束时间</List.Item>
                    </div>
                ) : null;
            break;

            case 99: // label，基本就是给详情页用的
                element = (
                    <List.Item extra={this.handle_input_value(detail_item[fname], item)}>{fvalue}</List.Item>
                );
            break;
        }
        
        return element;
    }

    handle_search_change = (...args) => {
        let {search_field_open} = this.state;

        search_field_open = !search_field_open;

        this.setState({search_field_open, loading: false, search_loading: false});
    }

    // 详情页 上一条/下一条
    handle_detail_pagination = (type, detail) => {
        if(!detail) return;

        let {detail_next, detail_last} = this.state;

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

    // 判断是否有上一条/下一条
    handle_detail_next = () => {
        let [detail_last, detail_next] = [false, false];
        let len = this.listDatas.length;
        if(len != 0){
            detail_last = !!this.listDatas[0].detail_order;
            detail_next = !!this.listDatas[len - 1].detail_order;
        }

        return {detail_last, detail_next};
    }

    /* 时段确定事件 */
    handle_calendar_submit = (start, end) => {
        let format = 'YYYY-MM-DD hh:mm:ss';
        this.state.search_param[this.calendar_key + 'Begin'] = T.clock(start).fmt(format);
        this.state.search_param[this.calendar_key + 'End'] = T.clock(end).fmt(format);
        
        this.setState({calendar_visible: false});
    }

    render() {
        let {children, config} = this;
        const {currentState, edit_config, search_field_open, detail_config, calendar_visible, loading, search_loading, container_height} = this.state;
        const {height = ClientHeight} = this.props;

        let sidebar = (
            <List>
                <List.Item>
                    <Button onClick={this.save} loading={search_loading}>确定</Button>
                </List.Item>
                {
                    config.map(item => {
                        return this.handle_ControlType(item, 'search');
                    })
                }
            </List>
        );

        let param = this.handle_detail_next();
        let [detail_last, detail_next] = [param.detail_last, param.detail_next];

        /* 详情页上一条数据 */
        let last = (
            <div className='extend-drawer left' onClick={() => this.handle_detail_pagination('last', detail_last)} style={{display: this.pageType == 'detail' && detail_last ? '' : 'none', top: (ClientHeight - 100) / 2}}>
                <img src='./assets/List_Container/arrow-left.png' />
            </div>
        );

        /* 详情页下一条数据 */
        let next = (
            <div className='extend-drawer right' onClick={() => this.handle_detail_pagination('next', detail_next)} style={{display: this.pageType == 'detail' && detail_next ? '' : 'none', top: (ClientHeight - 100) / 2}}>
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
                    <Button type='primary' onClick={this.save} inline style={{marginRight: 4, width: 'calc(50% - 4px)'}}>保存</Button>
                    <Button inline onClick={this.back} style={{width: '50%'}}>返回</Button>
                </List.Item>
            </List>
        );

        /* 详情页 */
        let detail_content = (
            <div style={{overflowX: 'hidden', position: 'relative'}}>
                {
                    this.listDatas.map(jtem => {
                        return (
                            <List className='detail-content' style={{transform: `translate3d(${jtem.detail_order * 100}%, ${jtem.index * -100}%, 0)`}}>
                                {
                                    detail_config.map(item => {
                                        return this.handle_ControlType(item, 'detail', jtem);
                                    })
                                }

                                <List.Item>
                                    <Button onClick={this.back}>返回上一级</Button>
                                </List.Item>
                            </List>
                        );
                    })
                }
            </div>
        );

        return (
            <div className='List_Container' style={{height: ClientHeight}}>
                {/* 触发搜索的方块 */}
                <div className='extend-drawer right' onClick={this.handle_search_change} style={{display: search_field_open || this.pageType != 'list' ? 'none' : '', top: (ClientHeight - 100) / 2}}>
                    <img src='./assets/List_Container/arrow-left.png' />
                </div>
                {/* 搜索面板 */}
                <Drawer open={search_field_open} onOpenChange={this.handle_search_change} className='search-drawer' sidebar={sidebar} position='right' sidebarStyle={{width: '77%', background: 'rgba(50, 50, 50, .35)'}} overlayStyle={{backgroundColor: 'rgba(50, 50, 50, 0)'}} style={{display: this.pageType == 'list' ? '' : 'none'}} />

                {/* 模板渲染 */}
                <PullToRefresh ref={ref => this.swiper = ref} direction='up' style={{height: container_height, overflow: 'auto'}} onRefresh={() => {this.search({PageIndex: ++this.state.search_param.PageIndex})}}>
                    <div className='content' style={{transform: `translate3d(${currentState * 100}%, 0, 0)`, display: this.pageType == 'list' ? '' : 'none'}} ref={ref => this.content = ref}>
                        {loading ? null : children.length == 0 ? <img src='./assets/List_Container/nodata.png' /> : children}
                    </div>
                </PullToRefresh>

                {/* 新增/修改/详情 */}
                <div className='edit-content' style={{transform: `translate3d(${(currentState + 1) * 100}%, 0, 0)`}} ref={ref => this.edit_content = ref}>
                    {last}
                    {this.pageType == 'detail' ? detail_content : edit_content}
                    {next}
                </div>

                <Calendar visible={calendar_visible} onCancel={() => {this.setState({calendar_visible: false})}} pickTime onConfirm={this.handle_calendar_submit} />

                <ActivityIndicator animating={loading} text='正在加载...' toast size='large' />
            </div>
        )
    }
}

const ClientHeight = document.documentElement.clientHeight || document.body.clientHeight

export default createForm()(List_Container);