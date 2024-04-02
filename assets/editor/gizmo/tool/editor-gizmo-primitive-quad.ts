/**
 * Gizmo 使用的图元组件，用于绘制一个 QUAD
 */

import { _decorator, Component, MeshRenderer, v3, Vec3, CCFloat } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

declare const cce: any;

const _twoPI = Math.PI * 2;

@ccclass('editor_gizmo_primitive_quad')
@executeInEditMode
export class editor_gizmo_primitive_quad extends Component {
    @property
    _width: number = 1;
    @property({
        type: CCFloat,
        tooltip: 'QUAD 的宽',
    })
    private get width() {
        return this._width;
    }
    private set width(value: number) {
        this._width = value;
        this.updateMesh();
    }

    @property
    _height: number = 1;
    @property({
        type: CCFloat,
        tooltip: 'QUAD 的高',
    })
    private get height() {
        return this._height;
    }
    private set height(value: number) {
        this._height = value;
        this.updateMesh();
    }

    @property
    _normal: Vec3 = new Vec3;
    @property({
        type: Vec3,
        tooltip: '绘制圆环的角度，360° 为一整个圆环',
        range: [0, 360, 1],
    })
    private get normal() {
        return this._normal;
    }
    private set normal(value: Vec3) {
        this._normal = value;
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
        const meshData = cce.Gizmo.__ControllerShape__.calcQuadData(v3(), this._width, this._height, this._normal);
        const mesh = cce.Gizmo.__EngineUtils__.createMesh(meshData);
        meshComp.mesh = mesh;
    }
}

