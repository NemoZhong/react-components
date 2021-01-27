export interface Point {
    x: number
    y: number
  }
  
  export enum Direction {
    Up,
    Right,
    Down,
    Left,
    Origin,
  }
  
  export const getAngleDegrees = (x: number, y: number) => {
    return (Math.atan2(y, x) * 180) / Math.PI
  }
  
  export const getDirection = (startPoint: Point, endPoint: Point) => {
    const MIN_DISTANCE = 2
    const distanceX = endPoint.x - startPoint.x
    const distanceY = -(endPoint.y - startPoint.y)
  
    if (Math.abs(distanceX) < MIN_DISTANCE && Math.abs(distanceY) < MIN_DISTANCE) {
      return Direction.Origin
    }
  
    const angleDegree = getAngleDegrees(distanceX, distanceY)
  
    if (angleDegree >= 45 && angleDegree < 135) {
      return Direction.Up
    }
    if (angleDegree >= -45 && angleDegree < 45) {
      return Direction.Right
    }
    if (angleDegree < -45 && angleDegree >= -135) {
      return Direction.Down
    }
  
    return Direction.Left
  }