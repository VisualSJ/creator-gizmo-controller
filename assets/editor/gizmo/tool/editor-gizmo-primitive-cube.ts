/**
 * Gizmo 使用的图元组件，用于绘制一个圆柱体
 */

import { _decorator, Component, MeshRenderer, CCInteger, CCFloat } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

declare const cce: any;

const _twoPI = Math.PI * 2;

@ccclass('editor_gizmo_primitive_cube')
@executeInEditMode
export class editor_gizmo_primitive_cube extends Component {
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
    _length: number = 1;
    @property({
        type: CCFloat,
        tooltip: '圆柱体的高度',
    })
    private get length() {
        return this._length;
    }
    private set length(value: number) {
        this._length = value;
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
        const meshData = cce.Gizmo.__ControllerShape__.calcCubeData(this._width, this._height, this._length, { radialSegments: 50, tubularSegments: 50 });
        const mesh = cce.Gizmo.__EngineUtils__.createMesh(meshData);
        meshComp.mesh = mesh;
    }
}

