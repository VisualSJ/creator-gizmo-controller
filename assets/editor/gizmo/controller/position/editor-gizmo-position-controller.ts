/**
 * 坐标 Gizmo
 * 三个箭头选中并拖拽时，会将物体向对应轴方向移动
 * 三个面选中并拖拽时，会将物体在对应平面上进行移动
 */

import { _decorator, Component, Node, Color, MeshRenderer, Vec3 } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

import { COLOR } from '../../../utils/config';
import { PlaneType, editor_gizmo_pan_plane_controller } from '../pan-plane/editor-gizmo-pan-plane-controller';

@ccclass('editor_gizmo_position_controller')
@executeInEditMode
export class editor_gizmo_position_controller extends Component {
    @property({
        type: Node,
    })
    arrowX: Node = null;

    @property({
        type: Node,
    })
    arrowY: Node = null;

    @property({
        type: Node,
    })
    arrowZ: Node = null;

    @property({
        type: Node,
    })
    planeX: Node = null;

    @property({
        type: Node,
    })
    planeY: Node = null;

    @property({
        type: Node,
    })
    planeZ: Node = null;

    @property({
        type: Node,
    })
    pan: Node = null;

    private _isDragging = false;

    start() {
        this.updateColor();
        this.bindEvent();
    }

    update(deltaTime: number) {
        
    }

    private updateColor() {
        this.planeX.getComponent(MeshRenderer).material.setProperty('mainColor', COLOR.X);
        this.planeY.getComponent(MeshRenderer).material.setProperty('mainColor', COLOR.Y);
        this.planeZ.getComponent(MeshRenderer).material.setProperty('mainColor', COLOR.Z);
        this.planeX.getComponent(MeshRenderer).material.setProperty('normalColor', COLOR.X);
        this.planeY.getComponent(MeshRenderer).material.setProperty('normalColor', COLOR.Y);
        this.planeZ.getComponent(MeshRenderer).material.setProperty('normalColor', COLOR.Z);

        this.updateArrowColor(COLOR.X, this.arrowX);
        this.updateArrowColor(COLOR.Y, this.arrowY);
        this.updateArrowColor(COLOR.Z, this.arrowZ);
    }

    private bindEvent() {
        let single = '';
        const panComp = this.pan.getComponent(editor_gizmo_pan_plane_controller);

        [
            {
                node: this.planeX,
                property: 'X',
                panType: PlaneType.yz,
            }, {
                node: this.planeY,
                property: 'Y',
                panType: PlaneType.xz,
            }, {
                node: this.planeZ,
                property: 'Z',
                panType: PlaneType.xy,
            },
        ].forEach((data) => {
            const node = data.node;
            const meshComp = node.getComponent(MeshRenderer);
            node.on('hoverIn', (event) => {
                // event.propagationStopped = true;
                meshComp.material.setProperty('mainColor', COLOR.SELECTED);
                meshComp.material.setProperty('normalColor', COLOR.SELECTED);
                panComp.planeType = data.panType;
            });
            node.on('hoverOut', (event) => {
                // event.propagationStopped = true;
                meshComp.material.setProperty('mainColor', COLOR[data.property]);
                meshComp.material.setProperty('normalColor', COLOR[data.property]);
            });
            node.on('mouseDown', (event) => {
                // event.propagationStopped = true;
                this._isDragging = true;
                panComp.startMoving();
            });
            node.on('mouseUp', (event) => {
                // event.propagationStopped = true;
                this._isDragging = false;
                panComp.stopMoving();
            });
        });

        [
            {
                node: this.arrowX,
                property: 'X',
                panType: PlaneType.xy,
            },
            {
                node: this.arrowY,
                property: 'Y',
                panType: PlaneType.xy,
            },
            {
                node: this.arrowZ,
                property: 'Z',
                panType: PlaneType.yz,
            },
        ].forEach((data) => {
            const node = data.node;
            node.children.forEach((child) => {
                child.on('hoverIn', (event) => {
                    event.propagationStopped = true;
                    panComp.planeType = data.panType;
                    this.updateArrowColor(COLOR.SELECTED, data.node);
                });
                child.on('hoverOut', (event) => {
                    event.propagationStopped = true;
                    this.updateArrowColor(COLOR[data.property], data.node);
                });
                child.on('mouseDown', (event) => {
                    // event.propagationStopped = true;
                    single = data.property;
                    this._isDragging = true;
                    panComp.startMoving();
                });
                child.on('mouseUp', (event) => {
                    // event.propagationStopped = true;
                    single = '';
                    this._isDragging = false;
                    panComp.stopMoving();
                });
            });
        });

        // 缓存的临时数据
        // 拖拽开始记录一个 world position
        // 移动的时候便宜量才能计算出来
        // point 缓存
        const _tempPoint = new Vec3();
        panComp.emitter.addListener('drag-start', (data) => {
            _tempPoint.set(this.node.getPosition());
        });
        panComp.emitter.addListener('drag-move', (data) => {
            if (this._isDragging === false) {
                return;
            }
            const position = _tempPoint.clone();
            switch (single) {
                case 'X':
                    position.x += data.x;
                    break;
                case 'Y':
                    position.y += data.y;
                    break;
                case 'Z':
                    position.z += data.z;
                    break;
                default:
                    position.add(data);
            }
            this.node.setPosition(position);

            // this.updatePosition();
            // cce.Engine.repaintInEditMode();
            // this.emitter.emit('box-changed', eventObject);
        });
        panComp.emitter.addListener('drag-end', (data) => {});
    }

    private updateArrowColor(color: Color, node: Node) {
        node.children.forEach((child) => {
            const comp = child.getComponent(MeshRenderer);
            comp.material.setProperty('mainColor', color);
        });
    }

    private updatePlaneColor(color: Color, node: Node) {
        const comp = node.getComponent(MeshRenderer);
        comp.material.setProperty('normalColor', color);
    }
}

