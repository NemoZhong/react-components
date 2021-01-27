import React, { ReactNode, TouchEvent, useState, useRef, useMemo,useImperativeHandle,forwardRef } from 'react'
import {debounce} from 'lodash'
import cn from 'classnames'
import { getDirection, Point, Direction } from './utils'
import styles from './index.less'

interface Props {
  children: ReactNode
  useBodyScroll?: boolean
  showRefreshTip?: boolean
  onPullFn?: () => void
  onReachEnd?: () => void
  loading?:boolean
}

function ChatContainer(props: Props,ref) {

// 考虑到移动端ios fixed定位失效，聊天界面的输入框ios会存在聚焦input丢失的情况，建议使用容器滚动，不使用body的滚动
  const { children, useBodyScroll = false, showRefreshTip = true, onReachEnd, onPullFn } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 })
//   const [originalScrollTop, setOriginalScrollTop] = useState(0)
// 判定一次下拉
  const [aPull,setAPull]=useState(false)
// 判断是否滚动到底部(到底部收到新消息才滚动至底部)
  const [isScrollEnd,setIsScrollEnd]=useState(true)


  const container = useMemo(() => {
    if (typeof document !== 'undefined' && useBodyScroll) {
        // 移动端兼容问题,使用bodyscroll时，优先使用scrollElement
      return document.scrollingElement || document.body
    }

    return containerRef.current
  }, [useBodyScroll,containerRef.current])

  useImperativeHandle(
      ref,
      () => ({
          scrollToEnd:()=>{
              if(container){
                  container.scrollTo(0,container.scrollHeight)
              }
          },
          isScrollEnd,
          // 暴露出容器当前的滚动高度，及容器本身，目的：拉取新数据时，滚动条保持原有位置(滚动条到底部的距离始终一致)
          // 获取数据前，保存滚动条到底部的距离 tmpHeight=currentScrollHeight-currentScrollTop
          // 获取数据后，滚动到之前的位置 container.scrollTo(0,currentScrollHeight-tmpHeight)
          currentScrollHeight:container?.scrollHeight,
          currentScrollTop:container?.scrollTop,
          container
      })
  )

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.2s ease-out'
    //   setOriginalScrollTop(containerRef.current.scrollTop)
    }

    setStartPoint({
      x: e.touches[0].pageX,
      y: e.touches[0].pageY,
    })
  }

  const handleTouchEnd = () => {
    setAPull(false)
    // if (containerRef.current) {
    //   containerRef.current.style.transition = 'transform 0.5s ease 1s'
    //   containerRef.current.style.transform = 'translateY(0px)'
    // }
  }

//   下拉刷新
//   const handlePullDown = (e: TouchEvent<HTMLDivElement>) => {
//     const currentTouch = e.touches[0]
//     const currentPoint = { x: currentTouch.pageX, y: currentTouch.pageY }
//     const maxDistance = 60

//     if (containerRef.current) {
//       const scrollDistance = currentPoint.y - startPoint.y

//       if (
//         scrollDistance - originalScrollTop > 0 &&
//         scrollDistance - originalScrollTop < maxDistance
//       ) {
//         if (onPullFn) {
//           containerRef.current.style.transform = `translateY(${scrollDistance}px)`

//           onPullFn()
//         }
//       }
//     }
//   }

// 下拉加载
  const handlePullDown=debounce(()=>{
    let isReachTop=false
    const maxDistance=60
    if(container){
        isReachTop = container.scrollTop <=maxDistance
        if(isReachTop && onPullFn){
            onPullFn()
        }
    }
  },300)

  const handlePullUp = debounce(() => {
    let isReachEnd = false
    const maxDistance = 60

    if (container) {
      isReachEnd =
        container.scrollTop + container.clientHeight + maxDistance >= container.scrollHeight

      if (isReachEnd && onReachEnd) {
          setIsScrollEnd(true)
          onReachEnd()
      }
    }
  }, 300)

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
      // 下拉过程中只允许触发一次到触底函数
      if(!aPull){
        const currentTouch = e.touches[0]
        const currentPoint = { x: currentTouch.pageX, y: currentTouch.pageY }
    
        const direction = getDirection(startPoint, currentPoint)

        setIsScrollEnd(true)
        setAPull(true)

        if (direction === Direction.Down) {
          handlePullDown(e)
        } else if (direction === Direction.Up) {
          handlePullUp()
        }
      }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      ref={containerRef}
      className={cn(styles.container, !showRefreshTip ? styles.noMarginTop : null)}
    >
      {showRefreshTip ? <div className={styles.indicator}>下拉刷新</div> : null}
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default forwardRef(ChatContainer)