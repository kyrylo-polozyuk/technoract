import type { ObservableCanvasInterface } from "./canvas"
import {
  PLANES,
  type Axis,
  type Coordinates,
  type Plane,
  type Shape,
  type Vector,
} from "./geometry"
import type { Camera } from "./types"

export type Scene = {
  shapes: Shape[]
}

export const getCanvasOrigin = (
  canvas: ObservableCanvasInterface,
): Coordinates => {
  return new Map([
    ["x", canvas.element.width / 2],
    ["y", canvas.element.height / 2],
    ["z", 0],
    ["a", 0],
  ])
}

export const drawScene = (
  scene: Scene,
  camera: Camera,
  canvas: ObservableCanvasInterface,
) => {
  if (canvas.context === null || canvas.offscreenContext === null) {
    return
  }

  const origin = getCanvasOrigin(canvas)

  canvas.context.globalCompositeOperation = "source-over"
  canvas.context.fillStyle = "rgba(0, 0, 0, 0.1)"
  canvas.context.fillRect(0, 0, canvas.element.width, canvas.element.height)

  for (const shape of scene.shapes) {
    drawShape(shape, origin, camera.fov, canvas.context)
  }
}

export const drawShape = (
  shape: Shape,
  origin: Coordinates,
  fov: number,
  context: CanvasRenderingContext2D,
) => {
  context.strokeStyle = "rgba(255, 255, 255, 0.125)"
  context.globalCompositeOperation = "screen"
  context.lineWidth = 2
  context.globalAlpha = 1

  context.beginPath()
  for (const [_, side] of shape.sides ?? []) {
    const start = shapeCoordinatesToCanvasCoordinates(
      shape.vertices.get(side[0]) as Coordinates,
      shape,
      origin,
      fov,
    )

    const end = shapeCoordinatesToCanvasCoordinates(
      shape.vertices.get(side[1]) as Coordinates,
      shape,
      origin,
      fov,
    )

    context.moveTo(start.get("x") ?? 0, start.get("y") ?? 0)
    context.lineTo(end.get("x") ?? 0, end.get("y") ?? 0)
  }
  context.stroke()
}

export const shapeCoordinatesToCanvasCoordinates = (
  coordinates: Coordinates,
  shape: Shape,
  origin: Coordinates,
  fov: number,
) => {
  const sceneCoordinates = shapeCoordinatesToSceneCoordinates(
    coordinates,
    shape,
  )
  const canvasCoordinates = sceneCoordinatesToCanvasPosition(
    sceneCoordinates,
    origin,
    fov,
  )
  return canvasCoordinates
}

export const shapeCoordinatesToSceneCoordinates = (
  coordinates: Coordinates,
  shape: Shape,
): Coordinates => {
  const adjustedCoordinates: Coordinates = new Map()
  // init
  shiftCoordinates(adjustedCoordinates, coordinates)

  // apply shape rotation
  for (const [axis, amount] of shape.rotation) {
    const plane1 = axis[0] as Plane
    const plane2 = axis[1] as Plane
    const vector = coordinatesToVector(adjustedCoordinates, axis)
    vector.angle = getModulo(vector.angle + amount, 360)
    const newCoordinates = vectorToCoordinates(vector, axis)
    adjustedCoordinates.set(plane1, newCoordinates.get(plane1) ?? 0)
    adjustedCoordinates.set(plane2, newCoordinates.get(plane2) ?? 0)
  }

  // apply shape position
  shiftCoordinates(adjustedCoordinates, shape.position)

  return adjustedCoordinates
}

const sceneCoordinatesToCanvasPosition = (
  coordinates: Coordinates,
  origin: Coordinates,
  fov: number,
): Coordinates => {
  const adjustedCoordinates: Coordinates = new Map([...coordinates])

  // apply FOV
  for (const plane of ["x", "y", "a"] satisfies Plane[]) {
    adjustedCoordinates.set(
      plane,
      (adjustedCoordinates.get(plane) ?? 0) *
        Math.pow(fov, adjustedCoordinates.get("z") ?? 0),
    )
  }

  for (const plane of ["x", "y", "z"] satisfies Plane[]) {
    adjustedCoordinates.set(
      plane,
      (adjustedCoordinates.get(plane) ?? 0) *
        Math.pow(fov, adjustedCoordinates.get("a") ?? 0),
    )
  }

  // apply origin offset
  shiftCoordinates(adjustedCoordinates, origin)

  return adjustedCoordinates
}

export const shiftCoordinates = (
  coordinates: Coordinates,
  change?: Coordinates,
) => {
  for (const plane of PLANES) {
    coordinates.set(
      plane,
      (coordinates.get(plane) ?? 0) + (change?.get(plane) ?? 0),
    )
  }
}

export const coordinatesToVector = (
  coordinates: Coordinates,
  axis: Axis,
): Vector => {
  const plane1 = axis[0] as Plane
  const plane2 = axis[1] as Plane
  const coordinate1 = coordinates.get(plane1) ?? 0
  const coordinate2 = coordinates.get(plane2) ?? 0

  if (coordinate1 > 0 && coordinate2 == 0) {
    return { angle: 0, length: Math.abs(coordinate1) }
  } else if (coordinate1 > 0 && coordinate2 > 0) {
    // I Quadrant
    return {
      angle: getReferenceAngle(coordinate1, coordinate2),
      length: getRadius(coordinate1, coordinate2),
    }
  } else if (coordinate1 == 0 && coordinate2 > 0) {
    return { angle: 90, length: Math.abs(coordinate2) }
  } else if (coordinate1 < 0 && coordinate2 > 0) {
    // II Quadrant
    return {
      angle: 180 - getReferenceAngle(coordinate1, coordinate2),
      length: getRadius(coordinate1, coordinate2),
    }
  } else if (coordinate1 < 0 && coordinate2 == 0) {
    return { angle: 180, length: Math.abs(coordinate1) }
  } else if (coordinate1 < 0 && coordinate2 < 0) {
    // III Quadrant
    return {
      angle: getReferenceAngle(coordinate1, coordinate2) + 180,
      length: getRadius(coordinate1, coordinate2),
    }
  } else if (coordinate1 == 0 && coordinate2 < 0) {
    return { angle: 270, length: Math.abs(coordinate2) }
  } else if (coordinate1 > 0 && coordinate2 < 0) {
    // IV Quadrant
    return {
      angle: 360 - getReferenceAngle(coordinate1, coordinate2),
      length: getRadius(coordinate1, coordinate2),
    }
  } else {
    return { angle: 0, length: 0 }
  }
}

function vectorToCoordinates(vector: Vector, axis: Axis): Coordinates {
  const { length, angle } = vector
  const coordinates: Coordinates = new Map()
  const plane1 = axis[0] as Plane
  const plane2 = axis[1] as Plane

  if (angle == 0) {
    coordinates.set(plane1, length)
    coordinates.set(plane2, 0)
  } else if (angle > 0 && angle < 90) {
    // I Quadrant
    coordinates.set(plane1, getAdjasent(length, angle))
    coordinates.set(plane2, getOpposite(length, angle))
  }
  if (angle == 90) {
    coordinates.set(plane1, 0)
    coordinates.set(plane2, length)
  } else if (angle > 90 && angle < 180) {
    // II Quadrant
    const referenceA = 180 - angle
    coordinates.set(plane1, -getAdjasent(length, referenceA))
    coordinates.set(plane2, getOpposite(length, referenceA))
  }
  if (angle == 180) {
    coordinates.set(plane1, -length)
    coordinates.set(plane2, 0)
  } else if (angle > 180 && angle < 270) {
    // III Quadrant
    const referenceA = angle - 180
    coordinates.set(plane1, -getAdjasent(length, referenceA))
    coordinates.set(plane2, -getOpposite(length, referenceA))
  }
  if (angle == 270) {
    coordinates.set(plane1, 0)
    coordinates.set(plane2, -length)
  } else if (angle > 270 && angle < 360) {
    // IV Quadrant
    const referenceA = 360 - angle
    coordinates.set(plane1, getAdjasent(length, referenceA))
    coordinates.set(plane2, -getOpposite(length, referenceA))
  }

  return coordinates
}

export const getReferenceAngle = (coordinate1: number, coordinate2: number) => {
  return deg(Math.atan(Math.abs(coordinate2) / Math.abs(coordinate1)))
}

export const deg = (rad: number) => {
  return (rad * 180) / Math.PI
}

export const rad = (deg: number) => {
  return (deg * Math.PI) / 180
}

export const getRadius = (coordinate1: number, coordinate2: number) => {
  return Math.sqrt(Math.pow(coordinate1, 2) + Math.pow(coordinate2, 2))
}

export const getModulo = (a: number, b: number) => {
  return ((a % b) + b) % b
}

export const getOpposite = (length: number, angle: number) => {
  return length * Math.sin(rad(angle))
}

export const getAdjasent = (length: number, angle: number) => {
  return length * Math.cos(rad(angle))
}
