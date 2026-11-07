Component({options:{styleIsolation:'apply-shared'},properties:{label:String,disabled:Boolean},methods:{tap(){if(!this.data.disabled)this.triggerEvent('action');}}});
