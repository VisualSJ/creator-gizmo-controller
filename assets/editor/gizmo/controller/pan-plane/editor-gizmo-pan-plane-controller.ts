import { _decorator, Component, Node, Vec3, Enum, Layers, CCBoolean, MeshRenderer, Color, find, Camera, NodeEventType, v3 } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

import { EventEmitter } from '../../../utils/event';

declare const cce: any;

export enum PlaneType {
    xy,
    xz,
    yz,
}
Enum(PlaneType);

@ccclass('editor_gizmo_pan_plane_controller')
@executeInEditMode
export class editor_gizmo_pan_plane_controller extends Component {
    private _wireColor = new Color(0, 255, 0, 255);
    private _hitPos = new Vec3();
    private _dirA = new Vec3(1, 0, 0);
    private _dirB = new Vec3(0, 1, 0);
    private _controllerPosA = new Vec3();
    private _controllerPosB = new Vec3();

    public emitter: EventEmitter<{
        'drag-start': {
            params: [ Vec3 ];
            result: void;
        },
        'drag-move': {
            params: [ Vec3 ];
            result: void;
        }
        'drag-end': {
            params: [ Vec3 ];
            result: void;
        }
    }> = new EventEmitter();

    @property(Node)
    planeA: Node = null;
    @property(Node)
    planeB: Node = null;

    // 事件锁，是否响应事件
    private _eventLock = true;

    private _planeType: PlaneType = PlaneType.xy;
    @property({
        type: PlaneType,
    })
    public get planeType() {
        return this._planeType;
    }
    public set planeType(value: PlaneType) {
        this._planeType = value;
        this.updateDirection();
    }

    private _debug = false;
    private _debugAlpha = 0;
    @property({
        type: CCBoolean,
    })
    public get debug() {
        return this._debug;
    }
    public set debug(value: boolean) {
        this._debug = value;
        this.updateDebug();
    }

    public start() {
        this.bindPlaneEvent();
        this.updateDebug();
        this.updateDirection();
        // this.startMoving();
        this.stopMoving();

        this.planeA.layer |= cce.Gizmo.__EngineUtils__.panPlaneLayer;
        this.planeB.layer |= cce.Gizmo.__EngineUtils__.panPlaneLayer;

        this.node.on(NodeEventType.TRANSFORM_CHANGED, () => {
            this.updateDirection();
        });
    }

    public update() {
        if (this._debug) {
            const node = find('Editor Scene Background/Editor Camera');
            const comp = node.components[0] as Camera;
            const renderer = comp.camera.geometryRenderer;
    
            // @zh 绘制拖拽的控制线
            // @en Draw the control line
            renderer.addLine(this._controllerPosA, this._hitPos, this._wireColor);
            renderer.addLine(this._controllerPosB, this._hitPos, this._wireColor);
        }
    }

    /**
     * @zh 更新方向，在三维世界里，一个平面可以用两个坐标轴表示
     * @en Update direction, in the three-dimensional world, a plane can be represented by two coordinate axes
     */
    private updateDirection() {
        const rotationA = new Vec3();
        const rotationB = new Vec3();
        if (this._planeType === PlaneType.xy) {
            rotationB.y = 180;
            this._dirA.set(1, 0, 0);
            this._dirB.set(0, 1, 0);
        } else if (this._planeType === PlaneType.xz) {
            rotationB.x = rotationA.x = -90;
            rotationB.z = 180;
            this._dirA.set(1, 0, 0);
            this._dirB.set(0, 0, 1);
        } else if (this._planeType === PlaneType.yz) {
            rotationB.y = rotationA.y = 90;
            rotationB.x = 180;
            this._dirA.set(0, 1, 0);
            this._dirB.set(0, 0, 1);
        }
        Vec3.transformQuat(this._dirA, this._dirA, this.node.getRotation());
        Vec3.transformQuat(this._dirB, this._dirB, this.node.getRotation());
        this.planeA.eulerAngles = rotationA;
        this.planeB.eulerAngles = rotationB;
    }

    private updateControllerPosition() {
        const w = this.node.getWorldPosition();
        Vec3.project(this._controllerPosA, this._hitPos, this._dirA);
        Vec3.project(this._controllerPosB, this._hitPos, this._dirB);
        if (this._planeType === PlaneType.xy) {
            this._controllerPosA.add(v3(0, w.y, w.z));
            this._controllerPosB.add(v3(w.x, 0, w.z));
        } else if (this._planeType === PlaneType.xz) {
            this._controllerPosA.add(v3(0, w.y, w.z));
            this._controllerPosB.add(v3(w.x, w.y, 0));
        } else if (this._planeType === PlaneType.yz) {
            this._controllerPosA.add(v3(w.x, 0, w.z));
            this._controllerPosB.add(v3(w.x, w.y, 0));
        }
    }

    /**
     * 
     */
    private bindPlaneEvent() {
        if (!this.planeA || !this.planeB) {
            return;
        }
        const tempVec3 = new Vec3();
        [this.planeA, this.planeB].forEach((plane) => {
            plane.on('mouseDown', (event) => {
                if (this._eventLock || !event.hitPoint) {
                    return;
                }
                event.propagationStopped = true;
                this._hitPos.set(event.hitPoint);
                tempVec3.set(event.hitPoint);
                this.updateControllerPosition();

                if (this._debug) {
                    cce.Engine.repaintInEditMode();
                }

                this.emitter.emit('drag-start', v3(
                    event.hitPoint.x - tempVec3.x,
                    event.hitPoint.y - tempVec3.y,
                    event.hitPoint.z - tempVec3.z,
                ));
            });
            plane.on('mouseMove', (event) => {
                if (this._eventLock || !event.hitPoint) {
                    return;
                }
                event.propagationStopped = true;
                this._hitPos.set(event.hitPoint);
                this.updateControllerPosition();
                
                if (this._debug) {
                    cce.Engine.repaintInEditMode();
                }

                this.emitter.emit('drag-move', v3(
                    event.hitPoint.x - tempVec3.x,
                    event.hitPoint.y - tempVec3.y,
                    event.hitPoint.z - tempVec3.z,
                ));
            });
            plane.on('mouseUp', (event) => {
                if (this._eventLock || !event.hitPoint) {
                    return;
                }
                event.propagationStopped = true;
                this._hitPos.set(event.hitPoint);
                this.updateControllerPosition();
                
                if (this._debug) {
                    cce.Engine.repaintInEditMode();
                }

                this.emitter.emit('drag-end', v3(
                    event.hitPoint.x - tempVec3.x,
                    event.hitPoint.y - tempVec3.y,
                    event.hitPoint.z - tempVec3.z,
                ));
            });
        });
    }

    /**
     * @zh 开关调试模式
     * @en Turn on the debugging mode
     */
    private updateDebug() {
        const compA = this.planeA.getComponent(MeshRenderer) as MeshRenderer;
        const compB = this.planeB.getComponent(MeshRenderer) as MeshRenderer;
        const color = (compA.material.getProperty('normalColor') as Color) || new Color(...(compA.material.effectAsset.techniques[0].passes[0].properties.normalColor.value as number[]).map(num => num * 255));
        if (!this._debug) {
            this._eventLock = true;
            this._debugAlpha = color.a;
            color.a = 0;
        } else {
            this._eventLock = false;
            color.a = this._debugAlpha;
        }
        compA.material.setProperty('normalColor', color);
        compB.material.setProperty('normalColor', color);
    }

    /**
     * @zh 开始监测鼠标移动，并整理 delta 数据，发送事件
     * @en Start monitoring mouse movement and organize delta data, and send events
     */
    public startMoving() {
        this._eventLock = false;
    }

    /**
     * @zh 结束监测鼠标移动，结束后不在发出事件
     * @en End monitoring mouse movement and end of not sending events
     */
    public stopMoving() {
        this._eventLock = true;
    }
}
