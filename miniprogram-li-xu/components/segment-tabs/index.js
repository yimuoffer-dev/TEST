Component({options:{styleIsolation:'apply-shared'},properties:{items:Array,value:String},methods:{select(e){this.triggerEvent('change',{value:e.currentTarget.dataset.value});}}});
