/**
 * @author Quazi / https://github.com/QuaziKb
 */

 // some useful stuff for managing polygon objects with outlines. note that the fill is generated with a fan at the center so this limits the concave shapes allowed to those with reasonable sharpness
 
THREE.FilledOutlineShape = function(pt_count,fill_material,outline_material) {
	
	this.pt_count = pt_count;
	this.pt_array = new Array(this.pt_count+1); //dishonest, we add an extra point that closes the shape
	for (var i = 0; i <= this.pt_count; i++) { 

		var p=i/(this.pt_count);
		
		this.pt_array[i]= new THREE.Vector2(Math.cos(p*Math.PI*2),Math.sin(p*Math.PI*2));	
	}
	var path = new THREE.Path( this.pt_array );
	var pathgeometry = path.createPointsGeometry( this.pt_array );
	pathgeometry.computeLineDistances();
			
	THREE.Line.call(this,pathgeometry, outline_material);
	
	var fillgeometry=new THREE.CircleGeometry( 1, this.pt_count );
	this.fill = new THREE.Mesh(fillgeometry,fill_material);
	
	// add polygon offset so the outline doesn't look clipped when the view is angled
	fill_material.polygonOffset=true;
	fill_material.polygonOffsetUnits=1;
	fill_material.polygonOffsetFactor=1;
	fill_material.side=THREE.DoubleSide;

	this.fill.geometry.verticesNeedUpdate = true;
	this.add( this.fill );
};

THREE.FilledOutlineShape.prototype = Object.assign( Object.create( THREE.Line.prototype ), {
	constructor: THREE.FilledOutlineShape,
	
	updateFillVertices: function () {

		for (var i = 0; i < this.pt_count ; i++) { 
			this.fill.geometry.vertices[i+1].copy(this.geometry.vertices[i]);
			
		};
		
		this.fill.geometry.verticesNeedUpdate = true;

	}
});