import React from 'react';
import './css/Swiper.css';
import classNames from 'classnames';

export interface SwiperProps {
  wrapperHeight: number;
  sensibility?: number;
  duration?: number;
  onRefresh?: () => void;
  onLoad?: () => void;
  loading?: boolean;
}
export interface SwiperState {
  distance: number;
  iconDeg: number;
  refreshEnd: boolean;
  loadEnd: boolean;
  refreshText: string;
  refreshImg: string;
  loadText: string;
  loadImg: string;
}

export default class Swiper extends React.Component<SwiperProps, SwiperState> {
  wrapper: HTMLDivElement | null;
  scroller: HTMLDivElement;
  startY = 0;
  endY = 0;
  down = '../../assets/Swiper/down.png';
  loading = '../../assets/Swiper/loading.gif';
  complete = '../../assets/Swiper/complete.png';
  scrollerHeight = 10000;
  bottomHeight = 0;

  constructor(props: SwiperProps) {
    super(props);
    this.state = {
      distance: 0, // 从touchstart记，到touchend结束，容器滑过的距离
      iconDeg: 0, // 箭头变换角度
      refreshEnd: false, // 刷新是否完成
      loadEnd: false, // 加载是否完成
      refreshText: '下拉刷新',
      refreshImg: this.down,
      loadText: '加载更多',
      loadImg: this.down,
    };
  }

  componentDidMount = () => {
    this.eventBind(this.wrapper);
  };

  reset = () => {
    this.getChildHeight();
  };

  getChildHeight = () => {
    const { wrapperHeight } = this.props;
    const { scrollHeight } = this.scroller;
    this.bottomHeight = scrollHeight - wrapperHeight + 44;
    this.scrollerHeight = scrollHeight;
  };

  eventBind = (refs: any) => {
    const { sensibility = 1 } = this.props;

    refs.addEventListener('touchstart', (e: any) => {
      // record coordinate before sliding
      this.startY = e.touches[0].pageY;
      this.setState({ refreshEnd: false, loadEnd: false });
    });

    refs.addEventListener('touchmove', (e: any) => {
      // 放在touchstart里会覆盖children里的click事件
      e.preventDefault();
      // 计算容器滑过的距离
      let distance =
        (e.touches[0].pageY - this.startY) / sensibility + this.endY;
      let iconDeg;
      if (distance > 44) {
        // 44是刷新、加载div的高度，超过时箭头向上
        iconDeg = 180;
      } else if (distance >= 0 && distance <= 44) {
        // 刷新没超过上方div高度时，根据比例变换箭头方向
        iconDeg = (distance / 44) * 180;
      } else {
        // 下方的加载偷懒没写箭头变换以及未超过44的行为，mark
        iconDeg = 180;
      }

      this.setState({ distance, iconDeg });
    });

    refs.addEventListener('touchend', () => {
      let { distance } = this.state;

      if (distance > 44) {
        // 拖到顶部的情况
        if (this.props.onRefresh) {
          this.setState({
            refreshImg: this.loading,
            refreshText: '刷新中...',
            distance: 44,
          });
          this.props.onRefresh();
        }
      } else if (distance > 0 && distance <= 44) {
        // 上方div未超过44的情况
        this.setState({ distance: 0 });
      } else if (distance < 0) {
        // 拖动到底部的情况
        const { offsetHeight, scrollHeight } = this.scroller;
        const differHeight = scrollHeight - offsetHeight;

        // 超出边界回弹
        if (Math.abs(distance) > differHeight) {
          // 这里不能写等于，不然容器拖到底部时，touchstart会触发加载事件
          this.endY = -differHeight;
          // 下拉加载
          if (this.props.onLoad) {
            this.props.onLoad();
            this.setState({
              loadText: '加载中...',
              loadImg: this.loading,
              distance: -this.bottomHeight,
            });
          } else {
            this.setState({ distance: -differHeight });
          }
        } else {
          // 未超出边界就停在那儿
          this.endY = distance;
        }
      }

      this.setState({
        refreshEnd: true,
        loadEnd: true,
      });
    });
  };

  cancelRefresh = () => {
    // 上方div在加载完后显示更新成功
    this.setState(
      {
        refreshImg: this.complete,
        refreshText: '刷新成功',
        iconDeg: 0,
      },
      () => {
        // 滑回去
        setTimeout(() => {
          this.reset();
          this.setState({
            refreshImg: this.down,
            distance: 0,
            refreshText: '下拉刷新',
          });
        }, 1000);
      },
    );
  };

  cancelLoad = (finishText = '加载完成') => {
    // 下方div在加载完后显示加载成功
    this.setState(
      {
        loadImg: this.complete,
        loadText: finishText,
        iconDeg: 0,
      },
      () => {
        // 滑回去
        setTimeout(() => {
          this.reset();
          this.setState({
            loadImg: this.down,
            distance: this.endY,
            loadText: '加载更多',
          });
        }, 1000);
      },
    );
  };

  render() {
    const {
      wrapperHeight,
      onRefresh,
      onLoad,
      children,
      duration = 1,
    } = this.props;
    const {
      distance,
      iconDeg,
      refreshEnd,
      refreshText,
      refreshImg,
      loadEnd,
      loadText,
      loadImg,
    } = this.state;
    const clientHeight =
      document.documentElement.clientHeight || document.body.clientHeight;
    const commonStyle = {
      transform: `translate3d(0px, ${distance}px, 0)`,
    };
    let refreshStyle = {
      transform: `translate3d(0px, ${distance}px, 0)`,
    };
    if (refreshEnd)
      refreshStyle = Object.assign(commonStyle, {
        transition: `all ${duration}s ease`,
      });
    let loadStyle = {
      ...commonStyle,
      top: this.scrollerHeight,
    };
    if (loadEnd)
      loadStyle = Object.assign(loadStyle, {
        top: this.scrollerHeight,
        transition: `all ${duration}s ease`,
      });
    const wrapStyle = Object.assign(
      { height: wrapperHeight || clientHeight },
      refreshStyle,
    );

    let refresh: React.ReactElement | null = null;
    if (onRefresh) {
      refresh = (
        <div
          className={classNames({
            refresh: true,
            'refresh-end': refreshEnd,
          })}
          style={refreshStyle}
        >
          <span
            className="refresh-icon"
            style={{ transform: `rotateZ(${iconDeg}deg)` }}
          >
            <img src={refreshImg} />
          </span>
          <span className="refresh-text">{refreshText}</span>
        </div>
      );
    }

    let load: React.ReactElement | null = null;
    if (onLoad) {
      load = (
        <div
          className={classNames({
            load: true,
            'load-end': loadEnd,
          })}
          style={loadStyle}
        >
          <span
            className="load-icon"
            style={{ transform: `rotateZ(${iconDeg}deg)` }}
          >
            <img src={loadImg} />
          </span>
          <span className="load-text">{loadText}</span>
        </div>
      );
    }

    console.log(wrapStyle, loadStyle, refreshStyle);
    return (
      <div className="Swiper">
        <div ref={ref => (this.wrapper = ref)} className="wrapper">
          <div style={wrapStyle} ref={ref => ref && (this.scroller = ref)}>
            {children}
          </div>
          {refresh}
          {load}
        </div>
      </div>
    );
  }
}
