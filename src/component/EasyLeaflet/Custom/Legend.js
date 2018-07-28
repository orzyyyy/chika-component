/*
 * @Author: zy9@github.com/zy410419243
 * @Date: 2018-07-28 08:08:07
 * @Last Modified by: zy9
 * @Last Modified time: 2018-07-28 08:10:04
 */

/**图例构建
 * config 传入的配置
 * theme 样式  dark/bright
 * title 标题
 * iconType 图例类型 img ：(绑定对应字段 src)   /  color ： (绑定对应字段 color)
 * row : [{name : 名称, color : '图例色值',src : 图例图片路径}]
*/
import React from 'react';

export class Legend extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			atk: true
		};
	}
    toggleLegend = () => {
    	this.setState({ atk: !this.state.atk });
    }
    render () {
    	const { config } = this.props;
    	let width = (config.width) ? { width: config.width } : {};

    	return (
    		<div className={'leaflet_legend ' + (config.theme || 'dark')} style={width}>
    			<div className='legend_title' onClick={() => this.toggleLegend()}>{config.title}</div>
    			<div className='legend_body' style={{ display: (this.state.atk) ? 'block' : 'none' }}>
    				{
    					config.row.map((item, i) => {
    						let icon;
    						let type = item.iconType || config.iconType;

    						switch (type) {
    							case 'color': icon = <i className='legend_icon' style={{ backgroundColor: item.color }}></i>; break;
    							case 'img': icon = <i className='legend_icon' style={{ background: 'url(' + item.src + ') no-repeat', backgroundSize: '100% 100%' }}></i>; break;
    							default: icon = <i className='legend_icon'></i>; break;
    						}
    						return <div className='legendItem' key={`legend${i}`}>{icon}<span>{item.name}</span></div>;
    					})
    				}
    			</div>
    		</div>
    	);
    }
}