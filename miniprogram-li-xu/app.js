const config=require('./config');
App({
 globalData:{statusBarHeight:24,fontReady:false},
 onLaunch(){
  try{this.globalData.statusBarHeight=wx.getWindowInfo?wx.getWindowInfo().statusBarHeight:wx.getSystemInfoSync().statusBarHeight;}catch(e){}
  if(/^https:\/\//.test(config.fontUrl))wx.loadFontFace({global:true,family:'LixuSerif',source:'url("'+config.fontUrl+'")',success:()=>{this.globalData.fontReady=true;}});
 }
});
