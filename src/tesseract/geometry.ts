export const PLANES = ["x", "y", "z", "a"] as const;
export type Plane = (typeof PLANES)[number];
import { v4 as uuidv4 } from "uuid";

export const AXES = [
  "xy",
  "xz",
  "yz",
  "xa",
  "ya",
  "za",
] as const satisfies `${Plane}${Plane}`[]; // todo figure out how to make it a dynamic type based on Axis or Axes

export type Axis = (typeof AXES)[number];

export type Coordinates = Map<Plane, number>;
export type Vector = { angle: number; length: number };
export type Rotation = Map<Axis, number>;
export type Side = [string, string];

export type Shape = {
  position: Coordinates;
  rotation: Rotation;
  vertices: Map<string, Coordinates>;
  sides?: Map<string, [string, string]>;
};

export const INIT_ROTATION: Rotation = AXES.reduce(
  (rotation: Rotation, axis) => {
    rotation.set(axis, 0);
    return rotation;
  },
  new Map()
);

export const INIT_POSITION: Coordinates = PLANES.reduce(
  (position: Coordinates, plane) => {
    position.set(plane, 0);
    return position;
  },
  new Map()
);

export const create90DegreeRegularShape = (
  dimensions = 4,
  sideLength = 100
): Shape => {
  if (dimensions > 4) {
    throw new Error(`Cannot have more than 4 dimensions`);
  }

  if (dimensions < 1) {
    throw new Error(`Cannot have more less than 1 dimension`);
  }

  const n = sideLength / 2;

  const addCoordinatesForAxis = (
    plane: Plane,
    arrayOfCoordinates: Coordinates[] | undefined
  ) => {
    const newArrayOfCoordinates: Coordinates[] = [];
    for (const sign of [1, -1]) {
      const axisCoordinates: Coordinates = new Map<Plane, number>([
        [plane, n * sign],
      ]);
      if (arrayOfCoordinates !== undefined) {
        for (const coordinates of arrayOfCoordinates) {
          newArrayOfCoordinates.push(
            new Map([...coordinates, ...axisCoordinates])
          );
        }
      } else {
        newArrayOfCoordinates.push(new Map([...axisCoordinates]));
      }
    }
    return newArrayOfCoordinates;
  };

  // create vertices of a tesseract
  let arrayOfCoordinates: Coordinates[] | undefined;
  for (let i = 0; i < dimensions; i++) {
    arrayOfCoordinates = addCoordinatesForAxis(PLANES[i], arrayOfCoordinates);
  }

  const vertices = new Map<string, Coordinates>();
  for (const coordinates of arrayOfCoordinates ?? []) {
    vertices.set(uuidv4(), coordinates);
  }

  const sides = new Map<string, Side>();

  // connect vertices on the same plane
  const disconnectedVertices = new Map(vertices);
  disconnectedVertices?.forEach((coordinates, id) => {
    for (const plane of coordinates.keys()) {
      // for a square/cube/tesseract etc. connected vertices only have one different coordinate
      disconnectedVertices?.forEach((otherVertex, otherId) => {
        let connect = true;
        for (const otherPlane of otherVertex.keys()) {
          if (otherPlane !== plane) {
            connect =
              connect &&
              coordinates.get(otherPlane) === otherVertex.get(otherPlane);
          } else {
            connect =
              connect && coordinates.get(plane) !== otherVertex.get(plane);
          }
        }

        if (connect) {
          sides.set(uuidv4(), [id, otherId]);
        }
      });
    }
    disconnectedVertices.delete(id);
  });

  return {
    vertices,
    sides,
    rotation: INIT_ROTATION,
    position: INIT_POSITION,
  };
};

export const getDistanceOfFurthestTwoVertices = (
  vertices: Coordinates[],
  planes: Plane[]
) => {
  if (planes.length < 2) {
    throw Error("Need at least 2 planes");
  }

  // reduce number of vertices to check
  const verticesToCheck = vertices.reduce((uniqueVertices, vertex) => {
    if (
      !uniqueVertices.find((uniqueVertex) => {
        let same = true;
        for (const plane of planes) {
          same = same && uniqueVertex.get(plane) === vertex.get(plane);
        }
        return same;
      })
    ) {
      uniqueVertices.push(vertex);
    }
    return uniqueVertices;
  }, [] as Coordinates[]);

  let distance = 0;
  for (let i = 0; i < verticesToCheck.length; i++) {
    for (let ii = 0; ii < verticesToCheck.length; ii++) {
      if (i === ii) {
        continue;
      }
      const thisDistance = getDistanceBetweenTwoVertices(
        verticesToCheck[i],
        verticesToCheck[ii],
        planes
      );
      distance = distance < thisDistance ? thisDistance : distance;
    }
  }

  return distance;
};

export const getDistanceBetweenTwoVertices = (
  vertex1: Coordinates,
  vertex2: Coordinates,
  planes: Plane[] = [...PLANES]
): number => {
  let summOfSquaredDifferences = 0;
  for (const plane of planes) {
    summOfSquaredDifferences += Math.pow(
      (vertex1.get(plane) ?? 0) - (vertex2.get(plane) ?? 0),
      2
    );
  }
  return Math.sqrt(summOfSquaredDifferences);
};
