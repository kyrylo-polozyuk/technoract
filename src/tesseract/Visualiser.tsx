
import { useEffect, useRef, useState } from "react";
import type { GeneratorService } from "../generator/service";
import type { SampleKey, TechnoState } from "../types";
import { ObservableCanvasInterface } from "./canvas";
import { AXES, create90DegreeRegularShape, INIT_POSITION, type Axis, type Shape } from "./geometry";
import { drawScene, type Scene } from "./renderer";
import type { Camera } from "./types";
import "./Visualiser.css";
import { Ticks } from "@audiotool/nexus/utils";

const FOV = 1.0025;
const SHAPE_SIDE_SIZE = 200;
const FADE_IN_DURATION = 3000;
const MAX_FOV = 1.0025;
const MIN_FOV = 1.002;
const MAX_OPACITY = 1;

export type VisualiserConfig = {
    fov: number;
    bpm: number;
    rotationSpeed: Map<Axis, number>;
    rotationStartingAngle: Map<Axis, number>;
    timeStart: number;
};

export const Visualiser = ({ service }: { service: GeneratorService }) => {
    const camera = useRef<Camera>({ coordinates: INIT_POSITION, fov: FOV });
    const shape = useRef<Shape>(create90DegreeRegularShape(4, SHAPE_SIDE_SIZE));
    const [canvas, setCanvas] = useState<ObservableCanvasInterface | undefined>(undefined);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const visualiserConfig = useRef<VisualiserConfig>({ fov: FOV, bpm: 120, rotationSpeed: new Map(), rotationStartingAngle: new Map(), timeStart: performance.now() });
    const [opacity, setOpacity] = useState(0);
    const [technoState, setTechnoState] = useState<TechnoState | undefined>(undefined);
    const lastRootNote = useRef<number | undefined>(undefined);

    useEffect(() => {
        camera.current.coordinates.set("z", SHAPE_SIDE_SIZE);
        return service.subscribeToTechnoStateChanges(
            (technoState) => {
                requestAnimationFrame(() => {
                    const config = visualiserConfig.current;

                    config.bpm = technoState?.config.fields.tempoBpm.value ?? 120;
                    camera.current.fov = FOV

                    if (lastRootNote.current !== technoState?.rootNote) {
                        lastRootNote.current = technoState?.rootNote;
                        config.timeStart = performance.now();
                    }

                    AXES.forEach((axis) => {
                        config.rotationSpeed.set(axis, 0);
                    });

                    config.rotationSpeed.set("za", ticksToRotation(technoState?.bassMidiEntities.region.fields.region.fields.loopDurationTicks.value ?? 0));
                    config.rotationSpeed.set(AXES.at(Math.floor(Math.random() * AXES.length)) ?? "xa", ticksToRotation(technoState?.padMidiEntities.region.fields.region.fields.loopDurationTicks.value ?? 0));

                    const getRotationStartingAngle = (sampleKey: SampleKey) => {
                        if (technoState?.machinisteMidiEntities.tracksAndRegions[sampleKey].notes.length === 0) {
                            return;
                        }
                        return ticksToRotation(technoState?.machinisteMidiEntities.tracksAndRegions[sampleKey].region.fields.region.fields.loopDurationTicks.value ?? 0) * 360;
                    }

                    config.rotationStartingAngle.set("xy", getRotationStartingAngle('kick') ?? 0);
                    config.rotationStartingAngle.set("xz", getRotationStartingAngle('clap') ?? 0);
                    config.rotationStartingAngle.set("yz", getRotationStartingAngle('ride') ?? 0);
                    config.rotationStartingAngle.set("xa", getRotationStartingAngle('open_hat') ?? getRotationStartingAngle('closed_hat') ?? 0);
                    config.rotationStartingAngle.set("ya", getRotationStartingAngle('shaker') ?? 0);
                    config.rotationStartingAngle.set("za", getRotationStartingAngle('twig') ?? 0);
                })
                setTechnoState(technoState);
            },
        )
    }, [service])

    useEffect(() => {
        if (canvas == null) {
            return;
        }


        const animate = () => {
            if (technoState === undefined) {
                setOpacity(0);
                return
            }

            const elapsed = performance.now() - visualiserConfig.current.timeStart;
            if (elapsed < FADE_IN_DURATION) {
                setOpacity(Math.pow((elapsed / FADE_IN_DURATION), 2) * MAX_OPACITY);
            } else {
                setOpacity(MAX_OPACITY);
            }

            if (technoState !== undefined) {
                const beatsInLoop = (technoState.machinisteMidiEntities.tracksAndRegions['kick'].region.fields.region.fields.loopDurationTicks.value ?? 0) / Ticks.Beat / 2;
                camera.current.fov = Math.cos((elapsed / 60000) * (visualiserConfig.current.bpm / beatsInLoop) + Math.PI) * (MAX_FOV - MIN_FOV) + MIN_FOV;
            }

            rotate(shape.current, visualiserConfig.current, () => {
                render(canvas, camera.current, shape.current);
            })
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current !== undefined) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [canvas, technoState]);

    return (
        <div className="visualiser" style={{ opacity }}>
            <ObservableCanvasInterface onCanvasReady={setCanvas} />
        </div>)
}

const render = (
    canvas: ObservableCanvasInterface,
    camera: Camera,
    shape: Shape,
) => {
    const scene: Scene = {
        shapes: [shape],
    };

    drawScene(scene, camera, canvas);
};


const rotate = (
    shape: Shape,
    config: VisualiserConfig,
    renderCallback: () => void
) => {
    const { bpm, timeStart, rotationSpeed, rotationStartingAngle } = config
    const msInBar = 60000 / (bpm / 4);

    const now = performance.now();
    const elapsed = now - Number(timeStart);
    const bars = elapsed / msInBar;

    const getAngle = (startingAngle: number, quarterRotationsPerBar: number) => {
        return startingAngle + (bars * quarterRotationsPerBar * 90);
    };

    const values: [Axis, number][] = AXES.map((axis) => [
        axis,
        getAngle(
            rotationStartingAngle.get(axis) ?? 0,
            rotationSpeed.get(axis) ?? 0
        ),
    ]);

    shape.rotation = new Map(values);
    renderCallback();
};

const ticksToRotation = (ticks: number) => {
    if (ticks === 0) return 0;
    return (4 * Ticks.Beat) / ticks;
}