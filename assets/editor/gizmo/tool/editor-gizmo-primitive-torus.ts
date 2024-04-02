/**
 * Gizmo 使用的图元组件，用于绘制一个圆环
 */

import { _decorator, Component, MeshRenderer, CCInteger, CCFloat } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

declare const cce: any;

const _twoPI = Math.PI * 2;

@ccclass('editor_gizmo_primitive_tours')
@executeInEditMode
export class editor_gizmo_primitive_tours extends Component {
    @property
    _radius: number = 1;
    @property({
        type: CCFloat,
        tooltip: '圆环半径',
    })
    private get radius() {
        return this._radius;
    }
    private set radius(value: number) {
        this._radius = value;
        this.updateMesh();
    }

    @property
    _tube: number = 0.005;
    @property({
        type: CCFloat,
        tooltip: '圆环截面的半径，可以理解为圆环的粗细',
    })
    private get tube() {
        return this._tube;
    }
    private set tube(value: number) {
        this._tube = value;
        this.updateMesh();
    }

    @property
    _angle: number = 360;
    @property({
        type: CCFloat,
        tooltip: '绘制圆环的角度，360° 为一整个圆环',
        range: [0, 360, 1],
    })
    private get angle() {
        return this._angle;
    }
    private set angle(value: number) {
        this._angle = value;
        this.updateMesh();
    }

    start() {
        const meshComp = this.node.getComponent(MeshRenderer);
        if (!meshComp) {
            this.node.addComponent(MeshRenderer);
        }
        this.updateMesh();
    }

    private updateMesh() {
        const meshComp = this.node.getComponent(MeshRenderer);
        if (!meshComp) {
            return;
        }
        const meshData = cce.Gizmo.__ControllerShape__.torus(this._radius, this._tube, { arc: this._angle / 360 * _twoPI, radialSegments: 50, tubularSegments: 50 });
        const mesh = cce.Gizmo.__EngineUtils__.createMesh(meshData);
        meshComp.mesh = mesh;
    }
}

