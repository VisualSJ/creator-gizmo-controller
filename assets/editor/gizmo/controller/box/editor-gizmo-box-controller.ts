import { _decorator, Component, Color, Node, Vec3, v3, Layers, find, Camera, Quat, MeshRenderer, v4, Enum } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

import { PlaneType, editor_gizmo_pan_plane_controller } from '../pan-plane/editor-gizmo-pan-plane-controller';
import { EventEmitter } from '../../../utils/event';

declare const cce: any;

export enum RenderMode {
    NORMAL,
    WIREFRAME,
}
Enum(RenderMode);

export enum OperationMode {
    SINGLE,
    CENTER,
}
Enum(OperationMode);

/**
 * @zh
 *   缩放控制组件
 *   负责显示包围盒，并且监听包围盒上的一些控制事件，向外发送对应的被操作事件
 *   在操作过程中，会忽略外部数据更新
 * @en
 *   Zoom Control Component
 *   Responsible for displaying the bounding box and listening to certain control events on the bounding box, sending out corresponding manipulated events when such events occur
 *   During the operation, it will ignore the external data update
 */
const axisDirectionMap: { [key: string]: Vec3 } = {
    'x': new Vec3(1, 0, 0),
    'y': new Vec3(0, 1, 0),
    'z': new Vec3(0, 0, 1),
    'neg_x': new Vec3(-1, 0, 0),
    'neg_y': new Vec3(0, -1, 0),
    'neg_z': new Vec3(0, 0, -1),
};

@ccclass('editor-gizmo-box-controller')
@executeInEditMode
export class EditorGizmoBoxController extends Component {

    private _tempQuat_a = new Quat();
    private _wireColor = new Color(0, 255, 0, 255);
    // 是否正在拖拽
    // 如果正在拖拽，外部设置的数据需要忽略，不然会造成多方数据同时更新，导致渲染混乱
    private _isDragging = false;
    private _isDraggingDir = 'x';
    private _vertices: [
        Vec3, Vec3, Vec3, Vec3,
        Vec3, Vec3, Vec3, Vec3,
    ] = [
        v3(), v3(), v3(), v3(),
        v3(), v3(), v3(), v3(),
    ];

    public emitter: EventEmitter<{
        'box-changed': {
            params: [
                {
                    dir: keyof typeof axisDirectionMap,
                    offset: number;
                },
            ];
            result: void;
        },
    }> = new EventEmitter();

    @property({
        type: Node,
        displayName: 'X 轴正面的控制点',
    })
    public x: Node = null;
    @property({
        type: Node,
        displayName: 'Y 轴正面的控制点',
    })
    public y: Node = null;
    @property({
        type: Node,
        displayName: 'Z 轴正面的控制点',
    })
    public z: Node = null;
    @property({
        type: Node,
        displayName: 'X 轴反面的控制点',
    })
    public negX: Node = null;
    @property({
        type: Node,
        displayName: 'Y 轴反面的控制点',
    })
    public negY: Node = null;
    @property({
        type: Node,
        displayName: 'Z 轴反面的控制点',
    })
    public negZ: Node = null;

    @property({
        type: Node,
        displayName: '立方体节点',
    })
    public cube: Node = null;

    @property({
        type: Node,
        displayName: '拖拽控制面',
    })
    public pan: Node = null;

    private _startPoint = new Vec3(0.5, 0.5, 0.5);
    @property({
        type: Vec3,
        displayName: '立方体起始点',
    })
    public get startPoint() {
        return this._startPoint;
    }
    public set startPoint(value: Vec3) {
        this._startPoint = value;
        if (this._isDragging === false) {
            this.updatePosition();
        }
    }

    private _endPoint = new Vec3(-0.5, -0.5, -0.5);
    @property({
        type: Vec3,
        displayName: '立方体结束点',
    })
    public get endPoint() {
        return this._endPoint;
    }
    public set endPoint(value: Vec3) {
        this._endPoint = value;
        if (this._isDragging === false) {
            this.updatePosition();
        }
    }

    private _renderMode = RenderMode.NORMAL;
    @property({
        type: RenderMode,
        displayName: '渲染模式',
        tooltip: 'NORMAL 会显示模型面\nWIREFRAME 则只显示线框'
    })
    public get renderMode() {
        return this._renderMode;
    }
    public set renderMode(value: RenderMode) {
        this._renderMode = value;
        this.updateRenderMode();
    }

    private _operationMode = OperationMode.CENTER;
    @property({
        type: OperationMode,
        displayName: '操作模式',
        tooltip: 'SINGLE 每一个面都可以单独操作\nCENTER 中心点对应的面总是会同时更改'
    })
    public get operationMode() {
        return this._operationMode;
    }
    public set operationMode(value: OperationMode) {
        this._operationMode = value;
        this.updateOperationMode();
    }

    start() {
        this.updatePosition();
        this.updateRenderMode();
        this.updateOperationMode();
        const cubeComp = this.cube.getComponent(MeshRenderer) as MeshRenderer;
        this.cube.layer |= Layers.BitMask.IGNORE_RAYCAST;
        this._wireColor = (cubeComp.material.getProperty('normalColor') as Color) || new Color(...(cubeComp.material.effectAsset.techniques[0].passes[0].properties.normalColor.value as number[]).map(num => num * 255));
        this._wireColor.a = 255;

        const panComp = this.pan.getComponent(editor_gizmo_pan_plane_controller) as editor_gizmo_pan_plane_controller;

        [
            {
                node: this.x,
                vec: v4(1, 0, 0, 0),
                dir: 'x',
            },
            {
                node: this.y,
                vec: v4(0, 1, 0, 0),
                dir: 'y',
            },
            {
                node: this.z,
                vec: v4(0, 0, 1, 0),
                dir: 'z',
            },
            {
                node: this.negX,
                vec: v4(-1, 0, 0, 0),
                dir: 'negX',
            },
            {
                node: this.negY,
                vec: v4(0, -1, 0, 0),
                dir: 'negY',
            },
            {
                node: this.negZ,
                vec: v4(0, 0, -1, 0),
                dir: 'negZ',
            },
        ].forEach((item) => {
            const comp = item.node.getComponent(MeshRenderer) as MeshRenderer;
            comp.material.setProperty('ignoreAlpha', 1);

            item.node.on('hoverIn', (event) => {
                event.propagationStopped = true;
                comp.material.setProperty('selectedFaceForward', v4(1, 1, 1, 1));
                cubeComp.material.setProperty('selectedFaceForward', item.vec);
                if (item.dir === 'x' || item.dir === 'negX') {
                    panComp.planeType = PlaneType.xy;
                } else {
                    panComp.planeType = PlaneType.yz;
                }
                this.pan.setWorldPosition(item.node.getWorldPosition());
            });
            item.node.on('hoverOut', (event) => {
                event.propagationStopped = true;
                comp.material.setProperty('selectedFaceForward', v4(0, 0, 0, 0));
                cubeComp.material.setProperty('selectedFaceForward', v4(0, 0, 0, 0));
            });

            item.node.on('mouseDown', (event) => {
                this._isDragging = true;
                this._isDraggingDir = item.dir;
                panComp.startMoving();
            });
            item.node.on('mouseUp', (event) => {
                this._isDragging = false;
                panComp.stopMoving();
            });
        });

        // 缓存的临时数据
        // 拖拽开始记录一个 world position
        // 移动的时候便宜量才能计算出来
        // point 缓存
        const _tempStartPoint = new Vec3();
        const _tempEndPoint = new Vec3();
        panComp.emitter.addListener('drag-start', (data) => {
            _tempStartPoint.set(this._startPoint);
            _tempEndPoint.set(this._endPoint);
        });
        panComp.emitter.addListener('drag-move', (data) => {
            if (this._isDragging === false) {
                return;
            }
            requestAnimationFrame(() => {
                const eventObject = {
                    dir: this._isDraggingDir,
                    offset: 0,
                };
                switch (this._isDraggingDir) {
                    case 'x':
                        this._startPoint.x = _tempStartPoint.x + data.x;
                        if (this._operationMode === OperationMode.CENTER) {
                            this._endPoint.x = _tempEndPoint.x - data.x;
                        }
                        eventObject.offset = data.x;
                        break;
                    case 'y':
                        this._startPoint.y = _tempStartPoint.y + data.y;
                        if (this._operationMode === OperationMode.CENTER) {
                            this._endPoint.y = _tempEndPoint.y - data.y;
                        }
                        eventObject.offset = data.y;
                        break;
                    case 'z':
                        this._startPoint.z = _tempStartPoint.z + data.z;
                        if (this._operationMode === OperationMode.CENTER) {
                            this._endPoint.z = _tempEndPoint.z - data.z;
                        }
                        eventObject.offset = data.z;
                        break;
                    case 'negX':
                        this._endPoint.x = _tempEndPoint.x + data.x;
                        if (this._operationMode === OperationMode.CENTER) {
                            this._startPoint.x = _tempStartPoint.x - data.x;
                        }
                        eventObject.offset = data.x;
                        break;
                    case 'negY':
                        this._endPoint.y = _tempEndPoint.y + data.y;
                        if (this._operationMode === OperationMode.CENTER) {
                            this._startPoint.y = _tempStartPoint.y - data.y;
                        }
                        eventObject.offset = data.y;
                        break;
                    case 'negZ':
                        this._endPoint.z = _tempEndPoint.z + data.z;
                        if (this._operationMode === OperationMode.CENTER) {
                            this._startPoint.z = _tempStartPoint.z - data.z;
                        }
                        eventObject.offset = data.z;
                        break;
                }
    
                this.updatePosition();
                cce.Engine.repaintInEditMode();
                this.emitter.emit('box-changed', eventObject);
            });
        });
        panComp.emitter.addListener('drag-end', (data) => {});
    }

    update(deltaTime: number) {
        const node = find('Editor Scene Background/Editor Camera');
        const comp = node.components[0] as Camera;
        const worldPosition = this.node.getWorldPosition();
        const rotation = this.node.getRotation();

        const renderer = comp.camera.geometryRenderer;

        // @zh 绘制 Cube 的线框
        // @en Draw Cube wireframe
        this._vertices[0].set(this._startPoint.x, this._startPoint.y, this._startPoint.z);
        this._vertices[1].set(this._startPoint.x, this._startPoint.y, this._endPoint.z  );
        this._vertices[2].set(this._startPoint.x, this._endPoint.y  , this._startPoint.z);
        this._vertices[3].set(this._endPoint.x  , this._startPoint.y, this._startPoint.z);

        this._vertices[4].set(this._startPoint.x, this._endPoint.y  , this._endPoint.z  );
        this._vertices[5].set(this._endPoint.x  , this._startPoint.y, this._endPoint.z  );
        this._vertices[6].set(this._endPoint.x  , this._endPoint.y  , this._startPoint.z);
        this._vertices[7].set(this._endPoint.x  , this._endPoint.y  , this._endPoint.z  );

        this._vertices.forEach((vertices) => {
            vertices.add(worldPosition);
            Vec3.transformQuat(vertices, vertices, rotation);
        });

        renderer.addLine(this._vertices[0], this._vertices[1], this._wireColor, false);
        renderer.addLine(this._vertices[0], this._vertices[2], this._wireColor, false);
        renderer.addLine(this._vertices[0], this._vertices[3], this._wireColor, false);

        renderer.addLine(this._vertices[7], this._vertices[4], this._wireColor, false);
        renderer.addLine(this._vertices[7], this._vertices[5], this._wireColor, false);
        renderer.addLine(this._vertices[7], this._vertices[6], this._wireColor, false);

        renderer.addLine(this._vertices[4], this._vertices[1], this._wireColor, false);
        renderer.addLine(this._vertices[4], this._vertices[2], this._wireColor, false);

        renderer.addLine(this._vertices[5], this._vertices[1], this._wireColor, false);
        renderer.addLine(this._vertices[5], this._vertices[3], this._wireColor, false);

        renderer.addLine(this._vertices[6], this._vertices[2], this._wireColor, false);
        renderer.addLine(this._vertices[6], this._vertices[3], this._wireColor, false);

        // @zh 始终让控制点朝向摄像机
        // @en Always make the control point face the camera
        node.getWorldRotation(this._tempQuat_a);
        this.x.setWorldRotation(this._tempQuat_a);
        this.y.setWorldRotation(this._tempQuat_a);
        this.z.setWorldRotation(this._tempQuat_a);
        this.negX.setWorldRotation(this._tempQuat_a);
        this.negY.setWorldRotation(this._tempQuat_a);
        this.negZ.setWorldRotation(this._tempQuat_a);
    }

    /*
     * @zh 更新内部节点的位置
     * @en Update the position of the internal node
     */
    updatePosition() {
        const a = this._startPoint;
        const b = this._endPoint;

        const c = v3(
            (a.x + b.x) / 2,
            (a.y + b.y) / 2,
            (a.z + b.z) / 2,
        );

        this.x.position = v3(a.x, c.y, c.z);
        this.y.position = v3(c.x, a.y, c.z);
        this.z.position = v3(c.x, c.y, a.z);

        this.negX.position = v3(b.x, c.y, c.z);
        this.negY.position = v3(c.x, b.y, c.z);
        this.negZ.position = v3(c.x, c.y, b.z);

        this.cube.scale = v3(this._startPoint).subtract(this._endPoint);
        this.cube.position = v3(this._startPoint).add(this._endPoint).divide(v3(2, 2, 2));
    }

    /**
     * @zh 更新渲染模式
     * @en Update rendering mode
     */
    updateRenderMode() {
        this.cube.active = this._renderMode === RenderMode.NORMAL;
    }

    /**
     * @zh 更新渲染模式
     * @en Update rendering mode
     */
    updateOperationMode() {

    }
}
