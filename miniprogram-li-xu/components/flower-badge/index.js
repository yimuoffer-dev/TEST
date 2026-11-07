const NAMES=['decor_plum','decor_bamboo','decor_chrysanthemum','decor_ginkgo'];
Component({options:{styleIsolation:'apply-shared'},properties:{art:{type:String,value:'decor_plum',observer(value){this.setData({source:'/assets/'+(NAMES.includes(value)?value:'decor_plum')+'.webp'});}},size:{type:Number,value:72}},data:{source:'/assets/decor_plum.webp'}});
