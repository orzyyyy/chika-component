/*
 * @Author: zy9@github.com/zy410419243
 * @Date: 2017-09-29 15:00:45
 * @Last Modified by: zy9
 * @Last Modified time: 2018-07-30 15:29:26
 */
import React from 'react';

import { Modal, DatePicker, List, InputItem, Drawer, Picker, Toast, Button, ActivityIndicator, PullToRefresh, Checkbox, Accordion, Calendar } from 'antd-mobile';
const operation = Modal.operation;
const { alert } = Modal;
const CheckboxItem = Checkbox.CheckboxItem;

import { createForm } from 'rc-form';

import Templet from './Templet';
import DetailArrow from './DetailArrow';
import FunctionalButton from './FunctionalButton';
import MapBox from './MaxBox';

import { bindTouchDirection } from '../../util/Touch';
import { handleDetailDatas } from './DataHandler';

import './css/List_Container.css';

import Serialize from '../../util/Serialize';
import moment from 'moment';

class ListContainer extends React.Component {
	constructor (props) {
		super(props);

		let { domain, config } = props;
		let { tcid, pageSize = 10 } = config;

		this.state = {
			currentState: 0, // 页面所处位置
			editConfig: [], // 新增/编辑页面配置
			loading: true, // 新增/编辑页面加载状态
			searchFieldOpen: false, // 搜索面板是否打开
			detailConfig: [], // 详情页配置
			calendarVisible: false, // 选择时段是否显示
			editParam: {}, // 新增/编辑页用的数据
			searchParam: { // 搜索参数
				TCID: tcid,
				PageSize: pageSize,
				PageIndex: 1,
			},
			searchLoading: false, // 搜索时加载
			containerHeight: ClientHeight, // 容器高度，用于滑动加载
			pullLoad: false, // 滑动分页是否加载中
			pageType: 'list', // 当前页面状态，列表页为list，编辑页为edit,详情页为detail,新增页为add
			mapBoxUrl: '', // 地图url，同时控制iframe显隐
		};

		// 用作debug
		this.getConfigUrl = domain ? domain + '/webapi/api/v2/generalbackstage/getconfig' : '../../data/getConfig.json';
		this.tableConfigUrl = domain ? domain + '/webapi/api/v2/generalbackstage/getinterfacedata' : '../../data/tableconfig.json';
		this.searchUrl = domain ? domain + '/webapi/api/v2/generalbackstage/getdata' : '../../data/search.json';
		this.generalbackstageUrl = domain ? domain + '/webapi/api/v2/generalbackstage/operatedata' : '../../data/tableconfig.json';

		this.children = []; // 遍历模板根据数据渲染 reactNode
		this.listDatas = []; // 列表数据 object
		this.power = []; // 权限字符串 string
		this.mainKey = ''; // 搜索主键 string
		this.mainValue = ''; // 搜索主键对应的value，用于编辑和修改
		this.config = []; // 配置 object
		this.detailNext = false; // 详情页是否还有下一页，true表示还有下一页
		this.detailLast = false; // 详情页是否还有上一页，true表示还有上一页
		this.calendarKey = ''; // 时段搜索参数名
		this.recordCount = 0; // 数据总数，分页，用于是否继续请求分页接口
		// this.sortBy = [] // 排序字段
	}

    componentDidMount = () => {
    	const { showSearch = true } = this.props.config;
    	// 绑定搜索面板滑动事件

    	showSearch ? bindTouchDirection(this.content, direction => {
    		switch(direction) {
    			case 'toLeft':
    				this.handleSearchChange();
    				break;

    			default:

    				break;
    		}
    	}) : null;

    	// 绑定详情页点击及滑动事件
    	bindTouchDirection(this.editWrapper, direction => {
    		const { pageType } = this.state;

    		if(pageType == 'detail') {
    			let { detailNext, detailLast } = this.handleDetailNext();

    			switch(direction) {
    				case 'toLeft':
    					if(detailNext) {
    						this.handleDetailPagination('next', detailNext);
    					}
    					break;

    				case 'toRight':
    					if(detailLast) {
    						this.handleDetailPagination('last', detailLast);
    					}
    					break;

    				default:

    					break;
    			}
    		}
    	});

    	// start
    	this.getConfig();
    }

    // 请求配置
    getConfig = () => {
    	const { tcid = -1, menuid = -1 } = this.props.config;

    	this.setState({ loading: true });

    	fetch(`${ this.getConfigUrl }?${ Serialize({ tcid, menuid }) }`)
    		.then(result => result.json())
    		.then(result => {
    			// 无论如何都会有查看的权限
    			let { power, tablefieldconfig } = result.data;

    			this.power = power.split(',');

    			this.config = tablefieldconfig;

    			// 搜索主键是列表点到详情页请求数据的唯一标识
    			for(let item of tablefieldconfig) {
    				// 判断是不是搜索主键，暂时按只有一个算
    				if(item.iskey) this.mainKey = item.fname;
    			}

    			this.search();
    		});
    }

    // 展示列表请求数据
    search = searchType => {
    	let { searchParam } = this.state;
    	let { url, config, domain } = this.props;
    	let { RequestUrl, RequestParams = {}, RequestMethod = 'GET', UserId = null, CellPhone = null } = config;

    	let data = {};

    	UserId ? data.UserId = UserId : null;
    	CellPhone ? data.CellPhone = CellPhone : null;

    	// 两种请求方式
    	data = url ?
    		Object.assign({}, { RequestUrl, RequestParams: Object.assign({}, data, RequestParams), RequestMethod })
    		:
    		Object.assign({}, searchParam, data, RequestParams);

    	// let tableConfig = `${ this.tableConfigUrl }?${ Serialize(data) }`;
    	let tableConfig = `${ this.tableConfigUrl }`;
    	// let search = `${ this.searchUrl }?${ Serialize(data) }`;
    	let search = `${ this.searchUrl }`;

    	const options = {
    		method: domain ? 'POST' : 'GET',
    		headers: {
    			'Content-Type': 'application/json; charset=UTF-8',
    		},
    		body: domain ? JSON.stringify(data) : null,
    	};

    	fetch(url ? tableConfig : search, options)
    		.then(result => result.json())
    		.then(result => {
    			let { list, recordcount } = result.data;

    			// 设置分页参数
    			this.recordCount = recordcount;

    			switch(searchType) {
    				case 'pullLoad': // 下拉加载
    					this.listDatas = [...this.listDatas, ...list];
    					break;

    				default:
    					this.listDatas = list;
    					break;
    			}

    			// 搜索后关闭面板
    			this.state.searchFieldOpen ? this.handleSearchChange() : this.setState({ loading: false, searchLoading: false, pullLoad: false });
    		});
    }

    /*
        初始化新增/编辑页面
        mainValue为搜索主键对应的值，mainKey在this里
        TODO: 该方法需要重构
    */
    handleItemEdit = (mainValue, type) => {
    	let { editConfig, detailConfig, editParam, pageType } = this.state;

    	pageType = type;

    	this.listDatas = handleDetailDatas(this.listDatas, mainValue, this.mainKey);

    	for(let item of this.config) {
    		const { fname, isvisiable, isadd, controltype } = item;

    		if(this.listDatas.length == 0) {
    			if(isadd) {
    				switch(type) {
    					case 'add':
    						editParam = {};
    						break;

    					default:

    						break;
    				}

    				// 初始化配置属性
    				const element = Object.assign({}, item, {
    					controltype: type == 'detail' ? 99 : controltype,
    					fname,
    					controltypeDetail: type == 'detail' ? controltype : null
    				});
    				// isvisiable，详情是否显示

    				type == 'detail' ? (isvisiable ? detailConfig.push(element) : null) : editConfig.push(element);
    			}
    		} else {
    			for(let jtem of this.listDatas) {
    				if(jtem[this.mainKey] == mainValue) {
    					for(let key in jtem) {
    						if(key == fname && isadd) { // isvisiable是在列表中的显隐，现在由模板绑定字段控制。这里的是编辑页面
    							switch(type) {
    								case 'edit':
    									editParam[key] = jtem[key];
    									break;

    								case 'add':
    									editParam = {};
    									break;

    								default:

    									break;
    							}

    							// 初始化配置属性
    							const element = Object.assign({}, item, {
    								controltype: type == 'detail' ? 99 : controltype,
    								fname: key,
    								controltypeDetail: type == 'detail' ? controltype : null
    							});

    							// isvisiable，详情是否显示
    							type == 'detail' ? (isvisiable ? detailConfig.push(element) : null) : editConfig.push(element);
    						}
    					}
    				}
    			}
    		}
    	}

    	this.setState({ currentState: -1, editParam, editConfig, detailConfig, pageType });
    }

    /**
     * 格式化表单数据
     * TODO: 需要在form里直接格式化数据
     */
    handleFormdata = () => {
    	let formData = this.props.form.getFieldsValue();

    	for(let key in formData) {
    		for(let item of this.config) {
    			let { fname, controltype, dateformat = 'YYYY-MM-DD HH:mm:ss' } = item;

    			if(key == fname) {
    				switch(controltype) {
    					case 2:
    						formData[key] = moment(formData[key]).format('YYYY-MM-DD HH:mm:ss');
    						break;

    					case 3:
    						formData[key] = formData[key].toString();
    						break;

    					default:

    						break;
    				}
    			}
    		}
    	}

    	return formData;
    }

    // 新增/修改提交
    save = () => {
    	const { domain } = this.props;

    	this.props.form.validateFields({ force: true }, (error, value) => {
    		let { searchParam, pageType } = this.state;
    		let { UserId = null, CellPhone = null } = this.props.config;

    		// 拼参数
    		let data = {};

    		UserId ? data.UserId = UserId : null;
    		CellPhone ? data.CellPhone = CellPhone : null;
    		data.OPType = pageType == 'add' ? 'add' : 'update';

    		let mainKey = {};

    		mainKey[this.mainKey] = this.mainValue;
    		let ajaxParam = {
    			key: 'generalbackstage',
    			f: 'json',
    			method: domain ? 'POST' : 'GET',
    			data: Object.assign({}, searchParam, data, this.handleFormdata(), pageType == 'edit' ? mainKey : {}),
    		};

    		if (!error) {
    			this.handleEditDatas(ajaxParam);
    		} else {
    			Toast.fail('ヽ(ｏ`皿′ｏ)ﾉ 操作失败', 2, null, false);
    		}
    	});
    }

    // 处理增改
    handleEditDatas = params => {
    	fetch(this.generalbackstageUrl + `?${ Serialize(params.data) }`)
    		.then(result => result.json())
    		.then(result => {
    			// if(!data.result) {
    			//     Toast.fail('出现未知错误，反正你这趟是白点了，找人问问是为啥？');
    			// }

    			this.state.searchParam.PageIndex = 1;
    			// 刷新列表
    			this.search('refresh');
    			// 过渡动画，重置数据
    			this.reset();
    		});
    }

    // 详情返回列表，顺带重置各种
    reset = () => {
    	// this.setState({ pageType: 'list' }, () => {
    	//     this.setState({ currentState: 0 }, () => {
    	//         /* 清空新增/编辑数据 */
    	//         this.setState({ editConfig: [], detailConfig: [] });
    	//     });
    	// });

    	this.setState({ currentState: 0 });
    	setTimeout(() => {
    		this.setState({ editConfig: [], detailConfig: [], pageType: 'list' });
    	}, 500);
    }

    delete = mainValue => {
    	const { domain } = this.props;

    	alert('长痛不如短痛，删tm的', '真删了啊？', [
    		{ text: '容朕三思' },
    		{ text: '真的', onPress: () => {
    			let { UserId = null, CellPhone = null, tcid = -1 } = this.props.config;

    			// 拼参数
    			let data = {};

    			UserId ? data.UserId = UserId : null;
    			CellPhone ? data.CellPhone = CellPhone : null;
    			data.OPType = 'delete';

    			let mainKey = {};

    			mainKey[this.mainKey] = mainValue;
    			let ajaxParam = {
    				key: 'generalbackstage',
    				f: 'json',
    				method: domain ? 'POST' : 'GET',
    				data: Object.assign({}, { TCID: tcid }, data, mainKey),
    			};

    			this.handleEditDatas(ajaxParam);
    		} },
    	]);
    }

    handleFormError = fname => Toast.info(this.props.form.getFieldError(fname).join('、'), 2, null, false);

    handleInput = (e, item, key) => {
    	this.state[item][key] = e;
    	this.setState({});
    }

    handleSelect = (e, item, key) => {
    	// TODO: 内部数据结构处理，数组需要转化，需要级联选择
    	this.state[item][key] = e[0];
    	this.setState({});
    }

    handleCheckbox = (value, item, key) => {
    	let param = this.state[item][key];

    	if(!param) param = this.state[item][key] = '';
    	param = new Set(param.split(','));

    	// 用作去掉勾选状态
    	if(param.size == 0) {
    		param.add(value);
    	} else {
    		param.has(value) ? param.delete(value) : param.add(value);
    	}
    	param.delete(',');

    	this.state[item][key] = [...param].toString();
    	this.setState({});
    }

    handleDate = (date, item, key, format) => {
    	this.state[item][key] = moment(date).format(format);
    	this.setState({});
    }

    // 验证
    // validate_value = (rule, value, callback, item) => {
    //     if (value && value.length > 2) {
    //         callback();
    //     } else {
    //         callback(new Error('test'));
    //     }
    // }

    // 详情页数据预处理
    handleInputValue = (value, item) => {
    	if(!value) return value;

    	if(value && typeof value == 'string') value = value.trim();

    	let { controltypeDetail, dateformat, foreigndata, unit, decimalcount } = item;

    	// TODO: pc中是没有日期格式字符串的配置的，这里是hack，
    	dateformat = dateformat.length == 0 ? 'YYYY-MM-DD HH:mm:ss' : dateformat;

    	let result = '';

    	switch(controltypeDetail) {
    		case 1: // 文本框
    			// 保留小数位数
    			if(typeof value == 'number' && decimalcount)
    				value = `${ parseFloat(value).toFixed(decimalcount) } ${ unit }`;
    			break;

    		case 2: // 时间
    			value = moment(new Date(value)).format(dateformat);
    			break;

    		case 3: // 下拉框，关联外键数据
    			for(let foreign of foreigndata) {
    				if(foreign.value == value) {
    					value = foreign.label;
    					break;
    				}
    			}
    			break;

    		case 5: // 多选框
    			for(let foreign of foreigndata) {
    				for(let item of value.split(',')) {
    					if(foreign.value == item) {
    						result += foreign.label + ',';
    					}
    				}
    			}
    			value = result.substring(0, result.length - 1);
    			break;

    		case 9: // 时段，但显示的时候跟时间没区别
    			value = moment(new Date(value)).format(dateformat);
    			break;

    		case 14: // 地图坐标选取

    			break;

    		default:
    			break;
    	}

    	return value;
    }

    //1. 文本框 2. 时间控件（日期：2012-01-01） 3. 下拉框 4. 单选框 5. 多选框
    //6. 数值控件 7. TextArea 8.隐藏域hidden 9.时间控件（时间：2012-01-01 00:00:00）
    //10.行政区划Ztree(支持多个) 11.部门Ztree(支持多个) 12.单、多附件上传 13.可输可选 14.地图坐标选取
    /* 搜索、详情、新增/编辑，控件类型都在这里处理 */
    handleControlType = (item, type, detailItem, index) => {
    	const { searchParam, editField, editParam } = this.state;
    	let { fname, fvalue, dateformat = 'YYYY-MM-DD', foreigndata, defaultvalue, isnull, regular, maxlen = '-', minlen = '-' } = item;
    	const { getFieldProps, getFieldError } = this.props.form;

    	if(type == 'search' && !item.issearchfield) return null;

    	// TODO: pc中是没有日期格式字符串的配置的，这里是hack
    	dateformat = dateformat.length == 0 ? 'YYYY-MM-DD' : dateformat;

    	/* 因为搜索条件也是要用到这里的，
            如果不判断type，form的key会重复绑定，导致第二次编辑无法输入 */
    	let element = [];
    	let option = {}, params = {};

    	let initDate = editParam[fname] ? new Date(editParam[fname]) : new Date();
    	let flag = !!searchParam[fname + '_Begin'] && !!searchParam[fname + '_End'];

    	const getLatng = () => {
    		this.mapFname = fname;

    		this.setState({ mapBoxUrl: '#/easyLeaflet' });
    	};

    	switch (item.controltype) {
    		case 1: // 文本框
    			option = {
    				onChange: e => this.handleInput(e, 'editParam', fname),
    				/* 设置默认值 */
    				initialValue: this.handleInputValue(editParam[fname], item) || this.handleInputValue(defaultvalue, item),
    				rules: [
    					{ required: !!isnull, message: '该值不能为空' },
    					{ pattern: regular, message: '该值不符合规则' },
    					{ max: maxlen, message: `长度太长，最多为${ maxlen }个字符` },
    					{ min: minlen, message: `长度太短，最少为${ minlen }个字符` },
    					// {validator: (rule, value, callback) => this.validate_value(rule, value, callback, item)},
    				],
    			};

    			params = {
    				key: `case_1_inputItem_${ index }`,
    				clear: true,
    				placeholder: '请输入'
    			};

    			element = type == 'search' ? (
    				<InputItem { ...params } onChange={ e => this.handleInput(e, 'searchParam', fname) } value={ searchParam[fname] }>{ fvalue }</InputItem>
    			) : (
    				<InputItem { ...params } {...getFieldProps(fname, option)} error={ !!getFieldError(fname) } onErrorClick={ () => this.handleFormError(fname) }>{ fvalue }</InputItem>
    			);
    			break;

    		case 2: // 时间控件
    			editParam[fname] ? editParam[fname] : '';

    			option = {
    				onChange: date => this.handleDate(date, 'editParam', fname, dateformat),
    				initialValue: initDate || defaultvalue,
    				rules: [{ required: !!isnull, message: '该值不能为空' }, ],
    			};
    			element = type == 'search' ? (
    				<DatePicker key={ `case_2_datePicker_${index}` } value={ searchParam[fname] ? new Date(searchParam[fname]) : null } onChange={ date => this.handleDate(date, 'searchParam', fname, dateformat) } format={ date => (moment(date).format(dateformat)) }>
    					<List.Item arrow='horizontal'>{ fvalue }</List.Item>
    				</DatePicker>
    			) : (
    				<DatePicker key={ `case_2_datePicker_${index}` } { ...getFieldProps(fname, option) } error={ !!getFieldError(fname) } onErrorClick={ () => this.handleFormError(fname) }>
    					<List.Item arrow='horizontal'>{ fvalue }</List.Item>
    				</DatePicker>
    			);
    			break;

    		case 3: // 下拉框
    			option = {
    				onChange: value => this.handleSelect(value, 'editParam', fname),
    				initialValue: [editParam[fname]],
    				rules: [ { required: !!isnull, message: '该值不能为空' }, ],
    			};
    			params = {
    				key: `case_3_picker_${index}`,
    				extra: '请选择',
    				data: foreigndata,
    				cols: 1,
    			};
    			element = type == 'search' ? (
    				<Picker { ...params } onChange={ value => this.handleSelect(value, 'searchParam', fname) } value={ [searchParam[fname]] }>
    					<List.Item arrow='horizontal'>{fvalue}</List.Item>
    				</Picker>
    			) : (
    				<Picker { ...params } { ...getFieldProps(fname, option) } error={ !!getFieldError(fname) } onErrorClick={ () => this.handleFormError(fname) }>
    					<List.Item arrow='horizontal'>{ fvalue }</List.Item>
    				</Picker>
    			);
    			break;

    		case 5: // 多选框
    			option = {
    				onChange: value => this.handleCheckbox(value, 'searchParam', fname),
    				rules: [{ required: !!isnull, message: '该值不能为空' }, ],
    			};
    			element = (
    				<Accordion key={ `case_5_accordion_${index}` }>
    					<Accordion.Panel header={ fvalue } key={ `case_5_accordion_panel_${index}` }>
    						<List key={ `case_5_list_${index}` }>
    							{ foreigndata.map(item => <CheckboxItem onChange={ value => this.handleCheckbox(item.value, 'searchParam', fname) } key={ item.value }>{ item.label }</CheckboxItem>) }
    						</List>
    					</Accordion.Panel>
    				</Accordion>
    			);
    			break;

    		case 9: // 时段
    			option = {
    				rules: [{ required: !!isnull, message: '该值不能为空' }, ]
    			};

    			this.calendarKey = fname;

    			element = type == 'search' ? (
    				<div key={`case_9_div_${ index }`}>
    					<List.Item key={ `case_9_list_0_${index}` } extra={ flag ? null : '请选择'} arrow='horizontal' onClick={() => this.setState({ calendarVisible: true }) }>{ fvalue }</List.Item>
    					<List.Item key={ `case_9_list_1_${index}` } extra={ flag ? moment(searchParam[fname + '_Begin']).format('YY-MM-DD HH:mm').toLocaleString() : null } style={{ display: flag ? '' : 'none' }}>{ fvalue }开始时间</List.Item>
    					<List.Item key={ `case_9_list_2_${index}` } extra={ flag ? moment(searchParam[fname + '_End']).format('YY-MM-DD HH:mm').toLocaleString() : null } style={{ display: flag ? '' : 'none' }}>{ fvalue }结束时间</List.Item>
    				</div>
    			) : null;
    			break;

    		case 14: // 地图选点
    			option = {
    				onChange: e => this.handleInput(e, 'editParam', fname),
    				/* 设置默认值 */
    				initialValue: this.handleInputValue(editParam[fname], item) || this.handleInputValue(defaultvalue, item),
    				rules: [
    					{ required: !!isnull, message: '该值不能为空' },
    					{ pattern: regular, message: '该值不符合规则' },
    					{ max: maxlen, message: `长度太长，最多为${ maxlen }个字符` },
    					{ min: minlen, message: `长度太短，最少为${ minlen }个字符` },
    					// {validator: (rule, value, callback) => this.validate_value(rule, value, callback, item)},
    				],
    			};

    			params = {
    				key: `case_1_inputItem_${ index }`,
    				clear: true,
    				placeholder: '请输入'
    			};

    			if(!editParam[fname] || Object.keys(editParam[fname]) == 0) {
    				element = (
    					<List.Item key={`case_14_listItem_${ index }`} arrow='horizontal' onClick={ getLatng } extra={ '请选择' }>{ fvalue }</List.Item>
    				);
    			} else {
    				element = [];

    				for(let key in editParam[fname]) {
    					switch(key) {
    						case 'address':
    							element.push(
    								<List.Item key={`case_14_listItem_address_${ index }`} arrow='horizontal' onClick={ getLatng } extra={ editParam[fname]['address'] }>地址</List.Item>
    							);
    							break;

    						case 'lat':
    							element.push(
    								<List.Item key={`case_14_listItem_lat_${ index }`} extra={ editParam[fname]['lat'] }>纬度</List.Item>
    							);
    							break;

    						case 'lng':
    							element.push(
    								<List.Item key={`case_14_listItem_lng_${ index }`} extra={ editParam[fname]['lng'] }>经度</List.Item>
    							);
    							break;

    						default:

    							break;
    					}
    				}
    			}

    			break;

    		case 99: // label，基本就是给详情页用的
    			element = (
    				<List.Item key={`case_99_listItem_${ index }`} extra={ this.handleInputValue(detailItem[fname], item) }>{ fvalue }</List.Item>
    			);
    			break;

    		default:

    			break;
    	}

    	return element;
    }

    // 处理搜索面板显隐
    handleSearchChange = (...args) => {
    	let { searchFieldOpen } = this.state;

    	searchFieldOpen = !searchFieldOpen;

    	this.setState({ searchFieldOpen, loading: false, searchLoading: false, pullLoad: false });
    }

    // 处理搜索事件
    handleSearch = () => {
    	let { searchParam } = this.state;

    	searchParam = Object.assign(searchParam, { AddSearchField: 1 });
    	this.setState({ searchLoading: true, searchParam }, () => {
    		this.search('search');
    	});
    }

    // 详情页 上一条/下一条
    handleDetailPagination = (type, detail) => {
    	if(!detail) return;

    	switch(type) {
    		case 'next': // 上一条
    			for(let i = 0; i < this.listDatas.length; i++) {
    				let item = this.listDatas[i];

    				item.detailOrder--;
    			}
    			break;

    		case 'last': // 下一条
    			for(let i = 0; i < this.listDatas.length; i++) {
    				let item = this.listDatas[i];

    				item.detailOrder++;
    			}
    			break;

    		default:

    			break;
    	}

    	this.setState({});
    }

    // 判断是否有上一条/下一条
    handleDetailNext = () => {
    	let [detailLast, detailNext] = [false, false];
    	let len = this.listDatas.length;

    	if(len != 0) {
    		detailLast = !!this.listDatas[0].detailOrder;
    		detailNext = !!this.listDatas[len - 1].detailOrder;
    	}

    	return { detailLast, detailNext };
    }

    /* 时段确定事件 */
    handleCalendarSubmit = (start, end) => {
    	let format = 'YYYY-MM-DD HH:mm:ss';

    	this.state.searchParam[this.calendarKey + '_Begin'] = moment(start).format(format);
    	this.state.searchParam[this.calendarKey + '_End'] = moment(end).format(format);

    	this.setState({ calendarVisible: false });
    }

    // 滑动加载
    handlePullLoad = () => {
    	if(this.listDatas.length < this.recordCount) {
    		let { searchParam } = this.state;
    		let { PageIndex } = searchParam;

    		let param = {
    			AddSearchField: 1,
    			PageIndex: ++PageIndex,
    		};

    		this.setState({ pullLoad: true, searchParam: Object.assign(searchParam, param) }, () => {
    			this.search('pullLoad');
    		});
    	}
    }

	handleOnMapClose = latng => {
		let { editParam } = this.state;

		editParam = Object.assign({}, editParam, { [this.mapFname]: latng });

		this.setState({ mapBoxUrl: '', editParam });
	}

    // 获得主键值，用作新增/修改
    getMainValue = value => this.mainValue = value;

    render = () => {
    	let { children, config, props } = this;
    	const { currentState, editConfig, searchFieldOpen, detailConfig, calendarVisible, loading, searchLoading, containerHeight, pullLoad, pageType, mapBoxUrl } = this.state;
    	let { style, bindKey, detailArrow, sortBy = [] } = props;
    	const { showSearch = true, showButton = true } = props.config;

    	style = Object.assign({}, { height: ClientHeight }, style);

    	let sidebar = (
    		<List>
    			<List.Item>
    				<Button onClick={ this.handleSearch } loading={ searchLoading }>确定</Button>
    			</List.Item>
    			{ config.map((item, i) => this.handleControlType(item, 'search', undefined, i)) }
    		</List>
    	);

    	let param = this.handleDetailNext();
    	let [detailLast, detailNext] = [param.detailLast, param.detailNext];

    	/* 新增/修改都是这个 */
    	let editContent = (
    		<List>
    			{ editConfig.map((item, i) => this.handleControlType(item, 'edit', undefined, i)) }

    			<List.Item>
    				<Button type='primary' onClick={ this.save } inline style={{ marginRight: 4, width: 'calc(50% - 4px)' }}>保存</Button>
    				<Button inline onClick={ this.reset } style={{ width: '50%' }}>返回</Button>
    			</List.Item>
    		</List>
    	);

    	/* 详情页 */
    	let detailContent = (
    		<div style={{ overflowX: 'hidden', position: 'relative' }}>
    			{
    				this.listDatas.map((jtem, j) => (
    					<List key={`listDatas_${ j }`} className='sc-detail-content' style={{ transform: `translate3d(${ jtem.detailOrder * 100 }%, ${ j * -100 }%, 0)` }}>
    						{ detailConfig.map((item, i) => this.handleControlType(item, 'detail', jtem, i)) }

    						<List.Item>
    							<Button onClick={ this.reset }>返回上一级</Button>
    						</List.Item>
    					</List>
    				))
    			}
    		</div>
    	);

    	/* 触发搜索的方块 */
    	let extendDrawer = showSearch ? (
    		<div className='sc-extend-drawer sc-right' onClick={ this.handleSearchChange } style={{ display: searchFieldOpen || pageType != 'list' ? 'none' : '', top: (ClientHeight - 100) / 2 }}>
    			<img src='../../assets/List_Container/arrow-left.png' />
    		</div>
    	) : null;

    	const templetConfig = {
    		display: pageType == 'list' ? '' : 'none',
    		mainKey: this.mainKey,
    		mainValue: this.getMainValue,
    		templet: props.children,
    		dataSource: this.listDatas,
    		onDetail: this.handleItemEdit,
    		power: this.power,
    		onDelete: this.delete,
    		// onSort: sortBy => this.sortBy = sortBy,
    		bindKey,
    	};

    	const drawerConfig = {
    		open: searchFieldOpen,
    		onOpenChange: this.handleSearchChange,
    		className: 'sc-search-drawer',
    		sidebar,
    		position: 'right',
    		sidebarStyle: { width: '77%', background: 'rgba(50, 50, 50, .35)' },
    		overlayStyle: { backgroundColor: 'rgba(50, 50, 50, 0)' },
    		style: { display: pageType == 'list' ? '' : 'none' }
    	};

    	const detailArrowConfig = {
    		visible: detailArrow,
    		displayLast: pageType == 'detail' && detailLast ? '' : 'none',
    		displayNext: pageType == 'detail' && detailNext ? '' : 'none',
    		height: style.height,
    		onClick: type => { type == 'next' ? this.handleDetailPagination(type, detailNext) : this.handleDetailPagination(type, detailLast); },
    	};

    	const functionalButtonConfig = {
    		visible: showButton && !searchFieldOpen && pageType == 'list',
    		onAdd: type => this.handleItemEdit(this.mainValue, type),
    		dataSource: this.listDatas,
    		sortBy,
    		power: this.power,
    		onSort: datas => {
    			this.listDatas = datas;

    			this.setState({});
    		},
    	};

    	return (
    		<div className='List_Container' style={ style }>
    			{/* 触发搜索的方块 */}
    			{ extendDrawer }

    			{/* 触发添加的图标 */}
    			<FunctionalButton { ...functionalButtonConfig } />

    			{/* 搜索面板 */}
    			<Drawer { ...drawerConfig }>
    				<span></span>
    			</Drawer>

    			{/* 模板渲染 */}
    			<PullToRefresh direction='up' style={{ height: containerHeight, overflow: 'auto' }} onRefresh={ this.handlePullLoad } refreshing={ pullLoad }>
    				<div className='sc-content' style={{ transform: `translate3d(${ currentState * 100 }%, 0, 0)`, display: pageType == 'list' ? '' : 'none' }} ref={ ref => this.content = ref }>
    					<Templet { ...templetConfig } />
    				</div>
    			</PullToRefresh>

    			{/* 新增/修改/详情 */}
    			<div className='sc-edit-content' style={{ transform: `translate3d(${ (currentState + 1) * 100 }%, 0, 0)` }} ref={ ref => this.editWrapper = ref }>
    				{ pageType == 'detail' ? detailContent : editContent }
    				<DetailArrow { ...detailArrowConfig } />
    			</div>

    			<Calendar visible={ calendarVisible } onCancel={ () => { this.setState({ calendarVisible: false }); } } pickTime onConfirm={ this.handleCalendarSubmit } />

    			<MapBox url={ mapBoxUrl } onClose={ this.handleOnMapClose } />

    			<ActivityIndicator animating={ loading } text='正在加载...' toast size='large' />
    		</div>
    	);
    }
}

const ClientHeight = document.documentElement.clientHeight || document.body.clientHeight;

export default createForm()(ListContainer);