/**
 * Gizmo 使用的图元组件，用于绘制一个圆柱体
 */

import { _decorator, Component, MeshRenderer, CCInteger, CCFloat } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

declare const cce: any;

const _twoPI = Math.PI * 2;

@ccclass('editor_gizmo_primitive_cylinder')
@executeInEditMode
export class editor_gizmo_primitive_cylinder extends Component {
    @property
    _topRadius: number = 1;
    @property({
        type: CCFloat,
        tooltip: '顶面圆半径',
    })
    private get topRadius() {
        return this._topRadius;
    }
    private set topRadius(value: number) {
        this._topRadius = value;
        this.updateMesh();
    }

    @property
    _bottomRadius: number = 1;
    @property({
        type: CCFloat,
        tooltip: '底面圆半径',
    })
    private get bottomRadius() {
        return this._bottomRadius;
    }
    private set bottomRadius(value: number) {
        this._bottomRadius = value;
        this.updateMesh();
    }

    @property
    _height: number = 2;
    @property({
        type: CCFloat,
        tooltip: '圆柱体的高度',
    })
    private get height() {
        return this._height;
    }
    private set height(value: number) {
        this._height = value;
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
        const meshData = cce.Gizmo.__ControllerShape__.calcCylinderData(this._topRadius, this._bottomRadius, this._height, { radialSegments: 50, tubularSegments: 50 });
        const mesh = cce.Gizmo.__EngineUtils__.createMesh(meshData);
        meshComp.mesh = mesh;
    }
}

