(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const Vo="180",Wu=0,_l=1,Xu=2,Uc=1,Nc=2,Wn=3,pi=0,Bt=1,gn=2,ui=0,mr=1,xl=2,vl=3,Ml=4,qu=5,Pi=100,Yu=101,Ku=102,ju=103,$u=104,Zu=200,Ju=201,Qu=202,eh=203,Ya=204,Ka=205,th=206,nh=207,ih=208,rh=209,sh=210,ah=211,oh=212,lh=213,ch=214,ja=0,$a=1,Za=2,_r=3,Ja=4,Qa=5,eo=6,to=7,Fc=0,uh=1,hh=2,hi=0,dh=1,fh=2,ph=3,Oc=4,mh=5,gh=6,_h=7,Bc=300,xr=301,vr=302,no=303,io=304,ea=306,ro=1e3,Di=1001,so=1002,cn=1003,xh=1004,fs=1005,In=1006,fa=1007,Ii=1008,Fn=1009,zc=1010,kc=1011,Yr=1012,Ho=1013,Fi=1014,Un=1015,is=1016,Go=1017,Wo=1018,Kr=1020,Vc=35902,Hc=35899,Gc=1021,Wc=1022,bn=1023,jr=1026,$r=1027,Xo=1028,qo=1029,Xc=1030,Yo=1031,Ko=1033,ks=33776,Vs=33777,Hs=33778,Gs=33779,ao=35840,oo=35841,lo=35842,co=35843,uo=36196,ho=37492,fo=37496,po=37808,mo=37809,go=37810,_o=37811,xo=37812,vo=37813,Mo=37814,So=37815,yo=37816,Eo=37817,To=37818,bo=37819,Ao=37820,wo=37821,Ro=36492,Co=36494,Po=36495,Lo=36283,Do=36284,Io=36285,Uo=36286,vh=3200,Mh=3201,qc=0,Sh=1,oi="",nn="srgb",Mr="srgb-linear",Ks="linear",et="srgb",Zi=7680,Sl=519,yh=512,Eh=513,Th=514,Yc=515,bh=516,Ah=517,wh=518,Rh=519,yl=35044,El="300 es",Nn=2e3,js=2001;class Tr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const r=n[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Ft=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Tl=1234567;const Vr=Math.PI/180,Zr=180/Math.PI;function br(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ft[i&255]+Ft[i>>8&255]+Ft[i>>16&255]+Ft[i>>24&255]+"-"+Ft[e&255]+Ft[e>>8&255]+"-"+Ft[e>>16&15|64]+Ft[e>>24&255]+"-"+Ft[t&63|128]+Ft[t>>8&255]+"-"+Ft[t>>16&255]+Ft[t>>24&255]+Ft[n&255]+Ft[n>>8&255]+Ft[n>>16&255]+Ft[n>>24&255]).toLowerCase()}function We(i,e,t){return Math.max(e,Math.min(t,i))}function jo(i,e){return(i%e+e)%e}function Ch(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)}function Ph(i,e,t){return i!==e?(t-i)/(e-i):0}function Hr(i,e,t){return(1-t)*i+t*e}function Lh(i,e,t,n){return Hr(i,e,1-Math.exp(-t*n))}function Dh(i,e=1){return e-Math.abs(jo(i,e*2)-e)}function Ih(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Uh(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Nh(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Fh(i,e){return i+Math.random()*(e-i)}function Oh(i){return i*(.5-Math.random())}function Bh(i){i!==void 0&&(Tl=i);let e=Tl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function zh(i){return i*Vr}function kh(i){return i*Zr}function Vh(i){return(i&i-1)===0&&i!==0}function Hh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Gh(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Wh(i,e,t,n,r){const s=Math.cos,a=Math.sin,o=s(t/2),c=a(t/2),l=s((e+n)/2),h=a((e+n)/2),d=s((e-n)/2),f=a((e-n)/2),m=s((n-e)/2),_=a((n-e)/2);switch(r){case"XYX":i.set(o*h,c*d,c*f,o*l);break;case"YZY":i.set(c*f,o*h,c*d,o*l);break;case"ZXZ":i.set(c*d,c*f,o*h,o*l);break;case"XZX":i.set(o*h,c*_,c*m,o*l);break;case"YXY":i.set(c*m,o*h,c*_,o*l);break;case"ZYZ":i.set(c*_,c*m,o*h,o*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function dr(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Vt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const on={DEG2RAD:Vr,RAD2DEG:Zr,generateUUID:br,clamp:We,euclideanModulo:jo,mapLinear:Ch,inverseLerp:Ph,lerp:Hr,damp:Lh,pingpong:Dh,smoothstep:Ih,smootherstep:Uh,randInt:Nh,randFloat:Fh,randFloatSpread:Oh,seededRandom:Bh,degToRad:zh,radToDeg:kh,isPowerOfTwo:Vh,ceilPowerOfTwo:Hh,floorPowerOfTwo:Gh,setQuaternionFromProperEuler:Wh,normalize:Vt,denormalize:dr};class Oe{constructor(e=0,t=0){Oe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class rs{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let c=n[r+0],l=n[r+1],h=n[r+2],d=n[r+3];const f=s[a+0],m=s[a+1],_=s[a+2],x=s[a+3];if(o===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d;return}if(o===1){e[t+0]=f,e[t+1]=m,e[t+2]=_,e[t+3]=x;return}if(d!==x||c!==f||l!==m||h!==_){let p=1-o;const u=c*f+l*m+h*_+d*x,E=u>=0?1:-1,T=1-u*u;if(T>Number.EPSILON){const R=Math.sqrt(T),A=Math.atan2(R,u*E);p=Math.sin(p*A)/R,o=Math.sin(o*A)/R}const M=o*E;if(c=c*p+f*M,l=l*p+m*M,h=h*p+_*M,d=d*p+x*M,p===1-o){const R=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=R,l*=R,h*=R,d*=R}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],c=n[r+1],l=n[r+2],h=n[r+3],d=s[a],f=s[a+1],m=s[a+2],_=s[a+3];return e[t]=o*_+h*d+c*m-l*f,e[t+1]=c*_+h*f+l*d-o*m,e[t+2]=l*_+h*m+o*f-c*d,e[t+3]=h*_-o*d-c*f-l*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(r/2),d=o(s/2),f=c(n/2),m=c(r/2),_=c(s/2);switch(a){case"XYZ":this._x=f*h*d+l*m*_,this._y=l*m*d-f*h*_,this._z=l*h*_+f*m*d,this._w=l*h*d-f*m*_;break;case"YXZ":this._x=f*h*d+l*m*_,this._y=l*m*d-f*h*_,this._z=l*h*_-f*m*d,this._w=l*h*d+f*m*_;break;case"ZXY":this._x=f*h*d-l*m*_,this._y=l*m*d+f*h*_,this._z=l*h*_+f*m*d,this._w=l*h*d-f*m*_;break;case"ZYX":this._x=f*h*d-l*m*_,this._y=l*m*d+f*h*_,this._z=l*h*_-f*m*d,this._w=l*h*d+f*m*_;break;case"YZX":this._x=f*h*d+l*m*_,this._y=l*m*d+f*h*_,this._z=l*h*_-f*m*d,this._w=l*h*d-f*m*_;break;case"XZY":this._x=f*h*d-l*m*_,this._y=l*m*d-f*h*_,this._z=l*h*_+f*m*d,this._w=l*h*d+f*m*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],c=t[9],l=t[2],h=t[6],d=t[10],f=n+o+d;if(f>0){const m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(h-c)*m,this._y=(s-l)*m,this._z=(a-r)*m}else if(n>o&&n>d){const m=2*Math.sqrt(1+n-o-d);this._w=(h-c)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+l)/m}else if(o>d){const m=2*Math.sqrt(1+o-n-d);this._w=(s-l)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(c+h)/m}else{const m=2*Math.sqrt(1+d-n-o);this._w=(a-r)/m,this._x=(s+l)/m,this._y=(c+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+a*o+r*l-s*c,this._y=r*h+a*c+s*o-n*l,this._z=s*h+a*l+n*c-r*o,this._w=a*h-n*o-r*c-s*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,r=this._y,s=this._z,a=this._w;let o=a*e._w+n*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=r,this._z=s,this;const c=1-o*o;if(c<=Number.EPSILON){const m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*r+t*this._y,this._z=m*s+t*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,o),d=Math.sin((1-t)*h)/l,f=Math.sin(t*h)/l;return this._w=a*d+this._w*f,this._x=n*d+this._x*f,this._y=r*d+this._y*f,this._z=s*d+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class L{constructor(e=0,t=0,n=0){L.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(bl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(bl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*r-o*n),h=2*(o*t-s*r),d=2*(s*n-a*t);return this.x=t+c*l+a*d-o*h,this.y=n+c*h+o*l-s*d,this.z=r+c*d+s*h-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,c=t.z;return this.x=r*c-s*o,this.y=s*a-n*c,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return pa.copy(this).projectOnVector(e),this.sub(pa)}reflect(e){return this.sub(pa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const pa=new L,bl=new rs;class Fe{constructor(e,t,n,r,s,a,o,c,l){Fe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,c,l)}set(e,t,n,r,s,a,o,c,l){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],d=n[7],f=n[2],m=n[5],_=n[8],x=r[0],p=r[3],u=r[6],E=r[1],T=r[4],M=r[7],R=r[2],A=r[5],P=r[8];return s[0]=a*x+o*E+c*R,s[3]=a*p+o*T+c*A,s[6]=a*u+o*M+c*P,s[1]=l*x+h*E+d*R,s[4]=l*p+h*T+d*A,s[7]=l*u+h*M+d*P,s[2]=f*x+m*E+_*R,s[5]=f*p+m*T+_*A,s[8]=f*u+m*M+_*P,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*a*h-t*o*l-n*s*h+n*o*c+r*s*l-r*a*c}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],d=h*a-o*l,f=o*c-h*s,m=l*s-a*c,_=t*d+n*f+r*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/_;return e[0]=d*x,e[1]=(r*l-h*n)*x,e[2]=(o*n-r*a)*x,e[3]=f*x,e[4]=(h*t-r*c)*x,e[5]=(r*s-o*t)*x,e[6]=m*x,e[7]=(n*c-l*t)*x,e[8]=(a*t-n*s)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-r*l,r*c,-r*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ma.makeScale(e,t)),this}rotate(e){return this.premultiply(ma.makeRotation(-e)),this}translate(e,t){return this.premultiply(ma.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ma=new Fe;function Kc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function $s(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Xh(){const i=$s("canvas");return i.style.display="block",i}const Al={};function Jr(i){i in Al||(Al[i]=!0,console.warn(i))}function qh(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}const wl=new Fe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rl=new Fe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Yh(){const i={enabled:!0,workingColorSpace:Mr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===et&&(r.r=Yn(r.r),r.g=Yn(r.g),r.b=Yn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===et&&(r.r=gr(r.r),r.g=gr(r.g),r.b=gr(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===oi?Ks:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Jr("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Jr("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Mr]:{primaries:e,whitePoint:n,transfer:Ks,toXYZ:wl,fromXYZ:Rl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:nn},outputColorSpaceConfig:{drawingBufferColorSpace:nn}},[nn]:{primaries:e,whitePoint:n,transfer:et,toXYZ:wl,fromXYZ:Rl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:nn}}}),i}const Ke=Yh();function Yn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function gr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Ji;class Kh{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Ji===void 0&&(Ji=$s("canvas")),Ji.width=e.width,Ji.height=e.height;const r=Ji.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=Ji}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=$s("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Yn(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Yn(t[n]/255)*255):t[n]=Yn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let jh=0;class $o{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:jh++}),this.uuid=br(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(ga(r[a].image)):s.push(ga(r[a]))}else s=ga(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function ga(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Kh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let $h=0;const _a=new L;class Wt extends Tr{constructor(e=Wt.DEFAULT_IMAGE,t=Wt.DEFAULT_MAPPING,n=Di,r=Di,s=In,a=Ii,o=bn,c=Fn,l=Wt.DEFAULT_ANISOTROPY,h=oi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:$h++}),this.uuid=br(),this.name="",this.source=new $o(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Oe(0,0),this.repeat=new Oe(1,1),this.center=new Oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(_a).x}get height(){return this.source.getSize(_a).y}get depth(){return this.source.getSize(_a).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Bc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ro:e.x=e.x-Math.floor(e.x);break;case Di:e.x=e.x<0?0:1;break;case so:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ro:e.y=e.y-Math.floor(e.y);break;case Di:e.y=e.y<0?0:1;break;case so:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Wt.DEFAULT_IMAGE=null;Wt.DEFAULT_MAPPING=Bc;Wt.DEFAULT_ANISOTROPY=1;class nt{constructor(e=0,t=0,n=0,r=1){nt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const c=e.elements,l=c[0],h=c[4],d=c[8],f=c[1],m=c[5],_=c[9],x=c[2],p=c[6],u=c[10];if(Math.abs(h-f)<.01&&Math.abs(d-x)<.01&&Math.abs(_-p)<.01){if(Math.abs(h+f)<.1&&Math.abs(d+x)<.1&&Math.abs(_+p)<.1&&Math.abs(l+m+u-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(l+1)/2,M=(m+1)/2,R=(u+1)/2,A=(h+f)/4,P=(d+x)/4,U=(_+p)/4;return T>M&&T>R?T<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(T),r=A/n,s=P/n):M>R?M<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),n=A/r,s=U/r):R<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(R),n=P/s,r=U/s),this.set(n,r,s,t),this}let E=Math.sqrt((p-_)*(p-_)+(d-x)*(d-x)+(f-h)*(f-h));return Math.abs(E)<.001&&(E=1),this.x=(p-_)/E,this.y=(d-x)/E,this.z=(f-h)/E,this.w=Math.acos((l+m+u-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Zh extends Tr{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:In,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new nt(0,0,e,t),this.scissorTest=!1,this.viewport=new nt(0,0,e,t);const r={width:e,height:t,depth:n.depth},s=new Wt(r);this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){const t={minFilter:In,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isArrayTexture=this.textures[r].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new $o(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class mi extends Zh{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class jc extends Wt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=cn,this.minFilter=cn,this.wrapR=Di,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Jh extends Wt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=cn,this.minFilter=cn,this.wrapR=Di,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Wi{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(xn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(xn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=xn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,xn):xn.fromBufferAttribute(s,a),xn.applyMatrix4(e.matrixWorld),this.expandByPoint(xn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ps.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ps.copy(n.boundingBox)),ps.applyMatrix4(e.matrixWorld),this.union(ps)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,xn),xn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Pr),ms.subVectors(this.max,Pr),Qi.subVectors(e.a,Pr),er.subVectors(e.b,Pr),tr.subVectors(e.c,Pr),ei.subVectors(er,Qi),ti.subVectors(tr,er),Si.subVectors(Qi,tr);let t=[0,-ei.z,ei.y,0,-ti.z,ti.y,0,-Si.z,Si.y,ei.z,0,-ei.x,ti.z,0,-ti.x,Si.z,0,-Si.x,-ei.y,ei.x,0,-ti.y,ti.x,0,-Si.y,Si.x,0];return!xa(t,Qi,er,tr,ms)||(t=[1,0,0,0,1,0,0,0,1],!xa(t,Qi,er,tr,ms))?!1:(gs.crossVectors(ei,ti),t=[gs.x,gs.y,gs.z],xa(t,Qi,er,tr,ms))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,xn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(xn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(zn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),zn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),zn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),zn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),zn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),zn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),zn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),zn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(zn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const zn=[new L,new L,new L,new L,new L,new L,new L,new L],xn=new L,ps=new Wi,Qi=new L,er=new L,tr=new L,ei=new L,ti=new L,Si=new L,Pr=new L,ms=new L,gs=new L,yi=new L;function xa(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){yi.fromArray(i,s);const o=r.x*Math.abs(yi.x)+r.y*Math.abs(yi.y)+r.z*Math.abs(yi.z),c=e.dot(yi),l=t.dot(yi),h=n.dot(yi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const Qh=new Wi,Lr=new L,va=new L;class Xi{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Qh.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Lr.subVectors(e,this.center);const t=Lr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(Lr,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(va.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Lr.copy(e.center).add(va)),this.expandByPoint(Lr.copy(e.center).sub(va))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const kn=new L,Ma=new L,_s=new L,ni=new L,Sa=new L,xs=new L,ya=new L;class ta{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(kn.copy(this.origin).addScaledVector(this.direction,t),kn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Ma.copy(e).add(t).multiplyScalar(.5),_s.copy(t).sub(e).normalize(),ni.copy(this.origin).sub(Ma);const s=e.distanceTo(t)*.5,a=-this.direction.dot(_s),o=ni.dot(this.direction),c=-ni.dot(_s),l=ni.lengthSq(),h=Math.abs(1-a*a);let d,f,m,_;if(h>0)if(d=a*c-o,f=a*o-c,_=s*h,d>=0)if(f>=-_)if(f<=_){const x=1/h;d*=x,f*=x,m=d*(d+a*f+2*o)+f*(a*d+f+2*c)+l}else f=s,d=Math.max(0,-(a*f+o)),m=-d*d+f*(f+2*c)+l;else f=-s,d=Math.max(0,-(a*f+o)),m=-d*d+f*(f+2*c)+l;else f<=-_?(d=Math.max(0,-(-a*s+o)),f=d>0?-s:Math.min(Math.max(-s,-c),s),m=-d*d+f*(f+2*c)+l):f<=_?(d=0,f=Math.min(Math.max(-s,-c),s),m=f*(f+2*c)+l):(d=Math.max(0,-(a*s+o)),f=d>0?s:Math.min(Math.max(-s,-c),s),m=-d*d+f*(f+2*c)+l);else f=a>0?-s:s,d=Math.max(0,-(a*f+o)),m=-d*d+f*(f+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(Ma).addScaledVector(_s,f),m}intersectSphere(e,t){kn.subVectors(e.center,this.origin);const n=kn.dot(this.direction),r=kn.dot(kn)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,c;const l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,f=this.origin;return l>=0?(n=(e.min.x-f.x)*l,r=(e.max.x-f.x)*l):(n=(e.max.x-f.x)*l,r=(e.min.x-f.x)*l),h>=0?(s=(e.min.y-f.y)*h,a=(e.max.y-f.y)*h):(s=(e.max.y-f.y)*h,a=(e.min.y-f.y)*h),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),d>=0?(o=(e.min.z-f.z)*d,c=(e.max.z-f.z)*d):(o=(e.max.z-f.z)*d,c=(e.min.z-f.z)*d),n>c||o>r)||((o>n||n!==n)&&(n=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,kn)!==null}intersectTriangle(e,t,n,r,s){Sa.subVectors(t,e),xs.subVectors(n,e),ya.crossVectors(Sa,xs);let a=this.direction.dot(ya),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ni.subVectors(this.origin,e);const c=o*this.direction.dot(xs.crossVectors(ni,xs));if(c<0)return null;const l=o*this.direction.dot(Sa.cross(ni));if(l<0||c+l>a)return null;const h=-o*ni.dot(ya);return h<0?null:this.at(h/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class rt{constructor(e,t,n,r,s,a,o,c,l,h,d,f,m,_,x,p){rt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,c,l,h,d,f,m,_,x,p)}set(e,t,n,r,s,a,o,c,l,h,d,f,m,_,x,p){const u=this.elements;return u[0]=e,u[4]=t,u[8]=n,u[12]=r,u[1]=s,u[5]=a,u[9]=o,u[13]=c,u[2]=l,u[6]=h,u[10]=d,u[14]=f,u[3]=m,u[7]=_,u[11]=x,u[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new rt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,r=1/nr.setFromMatrixColumn(e,0).length(),s=1/nr.setFromMatrixColumn(e,1).length(),a=1/nr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(r),l=Math.sin(r),h=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){const f=a*h,m=a*d,_=o*h,x=o*d;t[0]=c*h,t[4]=-c*d,t[8]=l,t[1]=m+_*l,t[5]=f-x*l,t[9]=-o*c,t[2]=x-f*l,t[6]=_+m*l,t[10]=a*c}else if(e.order==="YXZ"){const f=c*h,m=c*d,_=l*h,x=l*d;t[0]=f+x*o,t[4]=_*o-m,t[8]=a*l,t[1]=a*d,t[5]=a*h,t[9]=-o,t[2]=m*o-_,t[6]=x+f*o,t[10]=a*c}else if(e.order==="ZXY"){const f=c*h,m=c*d,_=l*h,x=l*d;t[0]=f-x*o,t[4]=-a*d,t[8]=_+m*o,t[1]=m+_*o,t[5]=a*h,t[9]=x-f*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const f=a*h,m=a*d,_=o*h,x=o*d;t[0]=c*h,t[4]=_*l-m,t[8]=f*l+x,t[1]=c*d,t[5]=x*l+f,t[9]=m*l-_,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const f=a*c,m=a*l,_=o*c,x=o*l;t[0]=c*h,t[4]=x-f*d,t[8]=_*d+m,t[1]=d,t[5]=a*h,t[9]=-o*h,t[2]=-l*h,t[6]=m*d+_,t[10]=f-x*d}else if(e.order==="XZY"){const f=a*c,m=a*l,_=o*c,x=o*l;t[0]=c*h,t[4]=-d,t[8]=l*h,t[1]=f*d+x,t[5]=a*h,t[9]=m*d-_,t[2]=_*d-m,t[6]=o*h,t[10]=x*d+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ed,e,td)}lookAt(e,t,n){const r=this.elements;return en.subVectors(e,t),en.lengthSq()===0&&(en.z=1),en.normalize(),ii.crossVectors(n,en),ii.lengthSq()===0&&(Math.abs(n.z)===1?en.x+=1e-4:en.z+=1e-4,en.normalize(),ii.crossVectors(n,en)),ii.normalize(),vs.crossVectors(en,ii),r[0]=ii.x,r[4]=vs.x,r[8]=en.x,r[1]=ii.y,r[5]=vs.y,r[9]=en.y,r[2]=ii.z,r[6]=vs.z,r[10]=en.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],d=n[5],f=n[9],m=n[13],_=n[2],x=n[6],p=n[10],u=n[14],E=n[3],T=n[7],M=n[11],R=n[15],A=r[0],P=r[4],U=r[8],y=r[12],S=r[1],D=r[5],O=r[9],H=r[13],K=r[2],q=r[6],Y=r[10],J=r[14],G=r[3],le=r[7],de=r[11],be=r[15];return s[0]=a*A+o*S+c*K+l*G,s[4]=a*P+o*D+c*q+l*le,s[8]=a*U+o*O+c*Y+l*de,s[12]=a*y+o*H+c*J+l*be,s[1]=h*A+d*S+f*K+m*G,s[5]=h*P+d*D+f*q+m*le,s[9]=h*U+d*O+f*Y+m*de,s[13]=h*y+d*H+f*J+m*be,s[2]=_*A+x*S+p*K+u*G,s[6]=_*P+x*D+p*q+u*le,s[10]=_*U+x*O+p*Y+u*de,s[14]=_*y+x*H+p*J+u*be,s[3]=E*A+T*S+M*K+R*G,s[7]=E*P+T*D+M*q+R*le,s[11]=E*U+T*O+M*Y+R*de,s[15]=E*y+T*H+M*J+R*be,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],c=e[9],l=e[13],h=e[2],d=e[6],f=e[10],m=e[14],_=e[3],x=e[7],p=e[11],u=e[15];return _*(+s*c*d-r*l*d-s*o*f+n*l*f+r*o*m-n*c*m)+x*(+t*c*m-t*l*f+s*a*f-r*a*m+r*l*h-s*c*h)+p*(+t*l*d-t*o*m-s*a*d+n*a*m+s*o*h-n*l*h)+u*(-r*o*h-t*c*d+t*o*f+r*a*d-n*a*f+n*c*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],d=e[9],f=e[10],m=e[11],_=e[12],x=e[13],p=e[14],u=e[15],E=d*p*l-x*f*l+x*c*m-o*p*m-d*c*u+o*f*u,T=_*f*l-h*p*l-_*c*m+a*p*m+h*c*u-a*f*u,M=h*x*l-_*d*l+_*o*m-a*x*m-h*o*u+a*d*u,R=_*d*c-h*x*c-_*o*f+a*x*f+h*o*p-a*d*p,A=t*E+n*T+r*M+s*R;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const P=1/A;return e[0]=E*P,e[1]=(x*f*s-d*p*s-x*r*m+n*p*m+d*r*u-n*f*u)*P,e[2]=(o*p*s-x*c*s+x*r*l-n*p*l-o*r*u+n*c*u)*P,e[3]=(d*c*s-o*f*s-d*r*l+n*f*l+o*r*m-n*c*m)*P,e[4]=T*P,e[5]=(h*p*s-_*f*s+_*r*m-t*p*m-h*r*u+t*f*u)*P,e[6]=(_*c*s-a*p*s-_*r*l+t*p*l+a*r*u-t*c*u)*P,e[7]=(a*f*s-h*c*s+h*r*l-t*f*l-a*r*m+t*c*m)*P,e[8]=M*P,e[9]=(_*d*s-h*x*s-_*n*m+t*x*m+h*n*u-t*d*u)*P,e[10]=(a*x*s-_*o*s+_*n*l-t*x*l-a*n*u+t*o*u)*P,e[11]=(h*o*s-a*d*s-h*n*l+t*d*l+a*n*m-t*o*m)*P,e[12]=R*P,e[13]=(h*x*r-_*d*r+_*n*f-t*x*f-h*n*p+t*d*p)*P,e[14]=(_*o*r-a*x*r-_*n*c+t*x*c+a*n*p-t*o*p)*P,e[15]=(a*d*r-h*o*r+h*n*c-t*d*c-a*n*f+t*o*f)*P,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,c=e.z,l=s*a,h=s*o;return this.set(l*a+n,l*o-r*c,l*c+r*o,0,l*o+r*c,h*o+n,h*c-r*a,0,l*c-r*o,h*c+r*a,s*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,c=t._w,l=s+s,h=a+a,d=o+o,f=s*l,m=s*h,_=s*d,x=a*h,p=a*d,u=o*d,E=c*l,T=c*h,M=c*d,R=n.x,A=n.y,P=n.z;return r[0]=(1-(x+u))*R,r[1]=(m+M)*R,r[2]=(_-T)*R,r[3]=0,r[4]=(m-M)*A,r[5]=(1-(f+u))*A,r[6]=(p+E)*A,r[7]=0,r[8]=(_+T)*P,r[9]=(p-E)*P,r[10]=(1-(f+x))*P,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;let s=nr.set(r[0],r[1],r[2]).length();const a=nr.set(r[4],r[5],r[6]).length(),o=nr.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],vn.copy(this);const l=1/s,h=1/a,d=1/o;return vn.elements[0]*=l,vn.elements[1]*=l,vn.elements[2]*=l,vn.elements[4]*=h,vn.elements[5]*=h,vn.elements[6]*=h,vn.elements[8]*=d,vn.elements[9]*=d,vn.elements[10]*=d,t.setFromRotationMatrix(vn),n.x=s,n.y=a,n.z=o,this}makePerspective(e,t,n,r,s,a,o=Nn,c=!1){const l=this.elements,h=2*s/(t-e),d=2*s/(n-r),f=(t+e)/(t-e),m=(n+r)/(n-r);let _,x;if(c)_=s/(a-s),x=a*s/(a-s);else if(o===Nn)_=-(a+s)/(a-s),x=-2*a*s/(a-s);else if(o===js)_=-a/(a-s),x=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=d,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=Nn,c=!1){const l=this.elements,h=2/(t-e),d=2/(n-r),f=-(t+e)/(t-e),m=-(n+r)/(n-r);let _,x;if(c)_=1/(a-s),x=a/(a-s);else if(o===Nn)_=-2/(a-s),x=-(a+s)/(a-s);else if(o===js)_=-1/(a-s),x=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=f,l[1]=0,l[5]=d,l[9]=0,l[13]=m,l[2]=0,l[6]=0,l[10]=_,l[14]=x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const nr=new L,vn=new rt,ed=new L(0,0,0),td=new L(1,1,1),ii=new L,vs=new L,en=new L,Cl=new rt,Pl=new rs;class jn{constructor(e=0,t=0,n=0,r=jn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],c=r[1],l=r[5],h=r[9],d=r[2],f=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-We(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(We(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-We(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Cl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Cl,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Pl.setFromEuler(this),this.setFromQuaternion(Pl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}jn.DEFAULT_ORDER="XYZ";class Zo{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let nd=0;const Ll=new L,ir=new rs,Vn=new rt,Ms=new L,Dr=new L,id=new L,rd=new rs,Dl=new L(1,0,0),Il=new L(0,1,0),Ul=new L(0,0,1),Nl={type:"added"},sd={type:"removed"},rr={type:"childadded",child:null},Ea={type:"childremoved",child:null};class Tt extends Tr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:nd++}),this.uuid=br(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Tt.DEFAULT_UP.clone();const e=new L,t=new jn,n=new rs,r=new L(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new rt},normalMatrix:{value:new Fe}}),this.matrix=new rt,this.matrixWorld=new rt,this.matrixAutoUpdate=Tt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Zo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ir.setFromAxisAngle(e,t),this.quaternion.multiply(ir),this}rotateOnWorldAxis(e,t){return ir.setFromAxisAngle(e,t),this.quaternion.premultiply(ir),this}rotateX(e){return this.rotateOnAxis(Dl,e)}rotateY(e){return this.rotateOnAxis(Il,e)}rotateZ(e){return this.rotateOnAxis(Ul,e)}translateOnAxis(e,t){return Ll.copy(e).applyQuaternion(this.quaternion),this.position.add(Ll.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Dl,e)}translateY(e){return this.translateOnAxis(Il,e)}translateZ(e){return this.translateOnAxis(Ul,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Vn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ms.copy(e):Ms.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Dr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Vn.lookAt(Dr,Ms,this.up):Vn.lookAt(Ms,Dr,this.up),this.quaternion.setFromRotationMatrix(Vn),r&&(Vn.extractRotation(r.matrixWorld),ir.setFromRotationMatrix(Vn),this.quaternion.premultiply(ir.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Nl),rr.child=e,this.dispatchEvent(rr),rr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(sd),Ea.child=e,this.dispatchEvent(Ea),Ea.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Vn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Vn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Vn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Nl),rr.child=e,this.dispatchEvent(rr),rr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Dr,e,id),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Dr,rd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const d=c[l];s(e.shapes,d)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(s(e.materials,this.material[c]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(s(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),l=a(e.textures),h=a(e.images),d=a(e.shapes),f=a(e.skeletons),m=a(e.animations),_=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),f.length>0&&(n.skeletons=f),m.length>0&&(n.animations=m),_.length>0&&(n.nodes=_)}return n.object=r,n;function a(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}}Tt.DEFAULT_UP=new L(0,1,0);Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Mn=new L,Hn=new L,Ta=new L,Gn=new L,sr=new L,ar=new L,Fl=new L,ba=new L,Aa=new L,wa=new L,Ra=new nt,Ca=new nt,Pa=new nt;class En{constructor(e=new L,t=new L,n=new L){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Mn.subVectors(e,t),r.cross(Mn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){Mn.subVectors(r,t),Hn.subVectors(n,t),Ta.subVectors(e,t);const a=Mn.dot(Mn),o=Mn.dot(Hn),c=Mn.dot(Ta),l=Hn.dot(Hn),h=Hn.dot(Ta),d=a*l-o*o;if(d===0)return s.set(0,0,0),null;const f=1/d,m=(l*c-o*h)*f,_=(a*h-o*c)*f;return s.set(1-m-_,_,m)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Gn)===null?!1:Gn.x>=0&&Gn.y>=0&&Gn.x+Gn.y<=1}static getInterpolation(e,t,n,r,s,a,o,c){return this.getBarycoord(e,t,n,r,Gn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Gn.x),c.addScaledVector(a,Gn.y),c.addScaledVector(o,Gn.z),c)}static getInterpolatedAttribute(e,t,n,r,s,a){return Ra.setScalar(0),Ca.setScalar(0),Pa.setScalar(0),Ra.fromBufferAttribute(e,t),Ca.fromBufferAttribute(e,n),Pa.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Ra,s.x),a.addScaledVector(Ca,s.y),a.addScaledVector(Pa,s.z),a}static isFrontFacing(e,t,n,r){return Mn.subVectors(n,t),Hn.subVectors(e,t),Mn.cross(Hn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Mn.subVectors(this.c,this.b),Hn.subVectors(this.a,this.b),Mn.cross(Hn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return En.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return En.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return En.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return En.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return En.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;sr.subVectors(r,n),ar.subVectors(s,n),ba.subVectors(e,n);const c=sr.dot(ba),l=ar.dot(ba);if(c<=0&&l<=0)return t.copy(n);Aa.subVectors(e,r);const h=sr.dot(Aa),d=ar.dot(Aa);if(h>=0&&d<=h)return t.copy(r);const f=c*d-h*l;if(f<=0&&c>=0&&h<=0)return a=c/(c-h),t.copy(n).addScaledVector(sr,a);wa.subVectors(e,s);const m=sr.dot(wa),_=ar.dot(wa);if(_>=0&&m<=_)return t.copy(s);const x=m*l-c*_;if(x<=0&&l>=0&&_<=0)return o=l/(l-_),t.copy(n).addScaledVector(ar,o);const p=h*_-m*d;if(p<=0&&d-h>=0&&m-_>=0)return Fl.subVectors(s,r),o=(d-h)/(d-h+(m-_)),t.copy(r).addScaledVector(Fl,o);const u=1/(p+x+f);return a=x*u,o=f*u,t.copy(n).addScaledVector(sr,a).addScaledVector(ar,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const $c={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ri={h:0,s:0,l:0},Ss={h:0,s:0,l:0};function La(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Ve{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=nn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ke.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Ke.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ke.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Ke.workingColorSpace){if(e=jo(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=La(a,s,e+1/3),this.g=La(a,s,e),this.b=La(a,s,e-1/3)}return Ke.colorSpaceToWorking(this,r),this}setStyle(e,t=nn){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=nn){const n=$c[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Yn(e.r),this.g=Yn(e.g),this.b=Yn(e.b),this}copyLinearToSRGB(e){return this.r=gr(e.r),this.g=gr(e.g),this.b=gr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=nn){return Ke.workingToColorSpace(Ot.copy(this),e),Math.round(We(Ot.r*255,0,255))*65536+Math.round(We(Ot.g*255,0,255))*256+Math.round(We(Ot.b*255,0,255))}getHexString(e=nn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ke.workingColorSpace){Ke.workingToColorSpace(Ot.copy(this),t);const n=Ot.r,r=Ot.g,s=Ot.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let c,l;const h=(o+a)/2;if(o===a)c=0,l=0;else{const d=a-o;switch(l=h<=.5?d/(a+o):d/(2-a-o),a){case n:c=(r-s)/d+(r<s?6:0);break;case r:c=(s-n)/d+2;break;case s:c=(n-r)/d+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=Ke.workingColorSpace){return Ke.workingToColorSpace(Ot.copy(this),t),e.r=Ot.r,e.g=Ot.g,e.b=Ot.b,e}getStyle(e=nn){Ke.workingToColorSpace(Ot.copy(this),e);const t=Ot.r,n=Ot.g,r=Ot.b;return e!==nn?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(ri),this.setHSL(ri.h+e,ri.s+t,ri.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ri),e.getHSL(Ss);const n=Hr(ri.h,Ss.h,t),r=Hr(ri.s,Ss.s,t),s=Hr(ri.l,Ss.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ot=new Ve;Ve.NAMES=$c;let ad=0;class qi extends Tr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ad++}),this.uuid=br(),this.name="",this.type="Material",this.blending=mr,this.side=pi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ya,this.blendDst=Ka,this.blendEquation=Pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ve(0,0,0),this.blendAlpha=0,this.depthFunc=_r,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Zi,this.stencilZFail=Zi,this.stencilZPass=Zi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==mr&&(n.blending=this.blending),this.side!==pi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ya&&(n.blendSrc=this.blendSrc),this.blendDst!==Ka&&(n.blendDst=this.blendDst),this.blendEquation!==Pi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==_r&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Sl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Zi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Zi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Zi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const c=s[o];delete c.metadata,a.push(c)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class un extends qi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ve(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new jn,this.combine=Fc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const yt=new L,ys=new Oe;let od=0;class Xt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:od++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=yl,this.updateRanges=[],this.gpuType=Un,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)ys.fromBufferAttribute(this,t),ys.applyMatrix3(e),this.setXY(t,ys.x,ys.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)yt.fromBufferAttribute(this,t),yt.applyMatrix3(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)yt.fromBufferAttribute(this,t),yt.applyMatrix4(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)yt.fromBufferAttribute(this,t),yt.applyNormalMatrix(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)yt.fromBufferAttribute(this,t),yt.transformDirection(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=dr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Vt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=dr(t,this.array)),t}setX(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=dr(t,this.array)),t}setY(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=dr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=dr(t,this.array)),t}setW(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),r=Vt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),r=Vt(r,this.array),s=Vt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==yl&&(e.usage=this.usage),e}}class Zc extends Xt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Jc extends Xt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class at extends Xt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let ld=0;const fn=new rt,Da=new Tt,or=new L,tn=new Wi,Ir=new Wi,Ct=new L;class wt extends Tr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ld++}),this.uuid=br(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Kc(e)?Jc:Zc)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Fe().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return fn.makeRotationFromQuaternion(e),this.applyMatrix4(fn),this}rotateX(e){return fn.makeRotationX(e),this.applyMatrix4(fn),this}rotateY(e){return fn.makeRotationY(e),this.applyMatrix4(fn),this}rotateZ(e){return fn.makeRotationZ(e),this.applyMatrix4(fn),this}translate(e,t,n){return fn.makeTranslation(e,t,n),this.applyMatrix4(fn),this}scale(e,t,n){return fn.makeScale(e,t,n),this.applyMatrix4(fn),this}lookAt(e){return Da.lookAt(e),Da.updateMatrix(),this.applyMatrix4(Da.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(or).negate(),this.translate(or.x,or.y,or.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new at(n,3))}else{const n=Math.min(e.length,t.count);for(let r=0;r<n;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Wi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];tn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ct.addVectors(this.boundingBox.min,tn.min),this.boundingBox.expandByPoint(Ct),Ct.addVectors(this.boundingBox.max,tn.max),this.boundingBox.expandByPoint(Ct)):(this.boundingBox.expandByPoint(tn.min),this.boundingBox.expandByPoint(tn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Xi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(e){const n=this.boundingSphere.center;if(tn.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];Ir.setFromBufferAttribute(o),this.morphTargetsRelative?(Ct.addVectors(tn.min,Ir.min),tn.expandByPoint(Ct),Ct.addVectors(tn.max,Ir.max),tn.expandByPoint(Ct)):(tn.expandByPoint(Ir.min),tn.expandByPoint(Ir.max))}tn.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)Ct.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(Ct));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Ct.fromBufferAttribute(o,l),c&&(or.fromBufferAttribute(e,l),Ct.add(or)),r=Math.max(r,n.distanceToSquared(Ct))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],c=[];for(let U=0;U<n.count;U++)o[U]=new L,c[U]=new L;const l=new L,h=new L,d=new L,f=new Oe,m=new Oe,_=new Oe,x=new L,p=new L;function u(U,y,S){l.fromBufferAttribute(n,U),h.fromBufferAttribute(n,y),d.fromBufferAttribute(n,S),f.fromBufferAttribute(s,U),m.fromBufferAttribute(s,y),_.fromBufferAttribute(s,S),h.sub(l),d.sub(l),m.sub(f),_.sub(f);const D=1/(m.x*_.y-_.x*m.y);isFinite(D)&&(x.copy(h).multiplyScalar(_.y).addScaledVector(d,-m.y).multiplyScalar(D),p.copy(d).multiplyScalar(m.x).addScaledVector(h,-_.x).multiplyScalar(D),o[U].add(x),o[y].add(x),o[S].add(x),c[U].add(p),c[y].add(p),c[S].add(p))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let U=0,y=E.length;U<y;++U){const S=E[U],D=S.start,O=S.count;for(let H=D,K=D+O;H<K;H+=3)u(e.getX(H+0),e.getX(H+1),e.getX(H+2))}const T=new L,M=new L,R=new L,A=new L;function P(U){R.fromBufferAttribute(r,U),A.copy(R);const y=o[U];T.copy(y),T.sub(R.multiplyScalar(R.dot(y))).normalize(),M.crossVectors(A,y);const D=M.dot(c[U])<0?-1:1;a.setXYZW(U,T.x,T.y,T.z,D)}for(let U=0,y=E.length;U<y;++U){const S=E[U],D=S.start,O=S.count;for(let H=D,K=D+O;H<K;H+=3)P(e.getX(H+0)),P(e.getX(H+1)),P(e.getX(H+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Xt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,m=n.count;f<m;f++)n.setXYZ(f,0,0,0);const r=new L,s=new L,a=new L,o=new L,c=new L,l=new L,h=new L,d=new L;if(e)for(let f=0,m=e.count;f<m;f+=3){const _=e.getX(f+0),x=e.getX(f+1),p=e.getX(f+2);r.fromBufferAttribute(t,_),s.fromBufferAttribute(t,x),a.fromBufferAttribute(t,p),h.subVectors(a,s),d.subVectors(r,s),h.cross(d),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,x),l.fromBufferAttribute(n,p),o.add(h),c.add(h),l.add(h),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(x,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let f=0,m=t.count;f<m;f+=3)r.fromBufferAttribute(t,f+0),s.fromBufferAttribute(t,f+1),a.fromBufferAttribute(t,f+2),h.subVectors(a,s),d.subVectors(r,s),h.cross(d),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ct.fromBufferAttribute(e,t),Ct.normalize(),e.setXYZ(t,Ct.x,Ct.y,Ct.z)}toNonIndexed(){function e(o,c){const l=o.array,h=o.itemSize,d=o.normalized,f=new l.constructor(c.length*h);let m=0,_=0;for(let x=0,p=c.length;x<p;x++){o.isInterleavedBufferAttribute?m=c[x]*o.data.stride+o.offset:m=c[x]*h;for(let u=0;u<h;u++)f[_++]=l[m++]}return new Xt(f,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new wt,n=this.index.array,r=this.attributes;for(const o in r){const c=r[o],l=e(c,n);t.setAttribute(o,l)}const s=this.morphAttributes;for(const o in s){const c=[],l=s[o];for(let h=0,d=l.length;h<d;h++){const f=l[h],m=e(f,n);c.push(m)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let d=0,f=l.length;d<f;d++){const m=l[d];h.push(m.toJSON(e.data))}h.length>0&&(r[c]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const r=e.attributes;for(const l in r){const h=r[l];this.setAttribute(l,h.clone(t))}const s=e.morphAttributes;for(const l in s){const h=[],d=s[l];for(let f=0,m=d.length;f<m;f++)h.push(d[f].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,h=a.length;l<h;l++){const d=a[l];this.addGroup(d.start,d.count,d.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ol=new rt,Ei=new ta,Es=new Xi,Bl=new L,Ts=new L,bs=new L,As=new L,Ia=new L,ws=new L,zl=new L,Rs=new L;class Et extends Tt{constructor(e=new wt,t=new un){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){ws.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const h=o[c],d=s[c];h!==0&&(Ia.fromBufferAttribute(d,e),a?ws.addScaledVector(Ia,h):ws.addScaledVector(Ia.sub(t),h))}t.add(ws)}return t}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Es.copy(n.boundingSphere),Es.applyMatrix4(s),Ei.copy(e.ray).recast(e.near),!(Es.containsPoint(Ei.origin)===!1&&(Ei.intersectSphere(Es,Bl)===null||Ei.origin.distanceToSquared(Bl)>(e.far-e.near)**2))&&(Ol.copy(s).invert(),Ei.copy(e.ray).applyMatrix4(Ol),!(n.boundingBox!==null&&Ei.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Ei)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,l=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,f=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,x=f.length;_<x;_++){const p=f[_],u=a[p.materialIndex],E=Math.max(p.start,m.start),T=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let M=E,R=T;M<R;M+=3){const A=o.getX(M),P=o.getX(M+1),U=o.getX(M+2);r=Cs(this,u,e,n,l,h,d,A,P,U),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),x=Math.min(o.count,m.start+m.count);for(let p=_,u=x;p<u;p+=3){const E=o.getX(p),T=o.getX(p+1),M=o.getX(p+2);r=Cs(this,a,e,n,l,h,d,E,T,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,x=f.length;_<x;_++){const p=f[_],u=a[p.materialIndex],E=Math.max(p.start,m.start),T=Math.min(c.count,Math.min(p.start+p.count,m.start+m.count));for(let M=E,R=T;M<R;M+=3){const A=M,P=M+1,U=M+2;r=Cs(this,u,e,n,l,h,d,A,P,U),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const _=Math.max(0,m.start),x=Math.min(c.count,m.start+m.count);for(let p=_,u=x;p<u;p+=3){const E=p,T=p+1,M=p+2;r=Cs(this,a,e,n,l,h,d,E,T,M),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}}function cd(i,e,t,n,r,s,a,o){let c;if(e.side===Bt?c=n.intersectTriangle(a,s,r,!0,o):c=n.intersectTriangle(r,s,a,e.side===pi,o),c===null)return null;Rs.copy(o),Rs.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Rs);return l<t.near||l>t.far?null:{distance:l,point:Rs.clone(),object:i}}function Cs(i,e,t,n,r,s,a,o,c,l){i.getVertexPosition(o,Ts),i.getVertexPosition(c,bs),i.getVertexPosition(l,As);const h=cd(i,e,t,n,Ts,bs,As,zl);if(h){const d=new L;En.getBarycoord(zl,Ts,bs,As,d),r&&(h.uv=En.getInterpolatedAttribute(r,o,c,l,d,new Oe)),s&&(h.uv1=En.getInterpolatedAttribute(s,o,c,l,d,new Oe)),a&&(h.normal=En.getInterpolatedAttribute(a,o,c,l,d,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:c,c:l,normal:new L,materialIndex:0};En.getNormal(Ts,bs,As,f.normal),h.face=f,h.barycoord=d}return h}class Kt extends wt{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const c=[],l=[],h=[],d=[];let f=0,m=0;_("z","y","x",-1,-1,n,t,e,a,s,0),_("z","y","x",1,-1,n,t,-e,a,s,1),_("x","z","y",1,1,e,n,t,r,a,2),_("x","z","y",1,-1,e,n,-t,r,a,3),_("x","y","z",1,-1,e,t,n,r,s,4),_("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(c),this.setAttribute("position",new at(l,3)),this.setAttribute("normal",new at(h,3)),this.setAttribute("uv",new at(d,2));function _(x,p,u,E,T,M,R,A,P,U,y){const S=M/P,D=R/U,O=M/2,H=R/2,K=A/2,q=P+1,Y=U+1;let J=0,G=0;const le=new L;for(let de=0;de<Y;de++){const be=de*D-H;for(let He=0;He<q;He++){const ot=He*S-O;le[x]=ot*E,le[p]=be*T,le[u]=K,l.push(le.x,le.y,le.z),le[x]=0,le[p]=0,le[u]=A>0?1:-1,h.push(le.x,le.y,le.z),d.push(He/P),d.push(1-de/U),J+=1}}for(let de=0;de<U;de++)for(let be=0;be<P;be++){const He=f+be+q*de,ot=f+be+q*(de+1),ht=f+(be+1)+q*(de+1),$e=f+(be+1)+q*de;c.push(He,ot,$e),c.push(ot,ht,$e),G+=6}o.addGroup(m,G,y),m+=G,f+=J}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Kt(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Sr(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r}}return e}function Ht(i){const e={};for(let t=0;t<i.length;t++){const n=Sr(i[t]);for(const r in n)e[r]=n[r]}return e}function ud(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Qc(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ke.workingColorSpace}const hd={clone:Sr,merge:Ht};var dd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,fd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class On extends qi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=dd,this.fragmentShader=fd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Sr(e.uniforms),this.uniformsGroups=ud(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class eu extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new rt,this.projectionMatrix=new rt,this.projectionMatrixInverse=new rt,this.coordinateSystem=Nn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const si=new L,kl=new Oe,Vl=new Oe;class rn extends eu{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Zr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Vr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Zr*2*Math.atan(Math.tan(Vr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){si.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(si.x,si.y).multiplyScalar(-e/si.z),si.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(si.x,si.y).multiplyScalar(-e/si.z)}getViewSize(e,t){return this.getViewBounds(e,kl,Vl),t.subVectors(Vl,kl)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Vr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;s+=a.offsetX*r/c,t-=a.offsetY*n/l,r*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const lr=-90,cr=1;class pd extends Tt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new rn(lr,cr,e,t);r.layers=this.layers,this.add(r);const s=new rn(lr,cr,e,t);s.layers=this.layers,this.add(s);const a=new rn(lr,cr,e,t);a.layers=this.layers,this.add(a);const o=new rn(lr,cr,e,t);o.layers=this.layers,this.add(o);const c=new rn(lr,cr,e,t);c.layers=this.layers,this.add(c);const l=new rn(lr,cr,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,c]=t;for(const l of t)this.remove(l);if(e===Nn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===js)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,c,l,h]=this.children,d=e.getRenderTarget(),f=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,s),e.setRenderTarget(n,1,r),e.render(t,a),e.setRenderTarget(n,2,r),e.render(t,o),e.setRenderTarget(n,3,r),e.render(t,c),e.setRenderTarget(n,4,r),e.render(t,l),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,r),e.render(t,h),e.setRenderTarget(d,f,m),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class tu extends Wt{constructor(e=[],t=xr,n,r,s,a,o,c,l,h){super(e,t,n,r,s,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class md extends mi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new tu(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Kt(5,5,5),s=new On({name:"CubemapFromEquirect",uniforms:Sr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Bt,blending:ui});s.uniforms.tEquirect.value=t;const a=new Et(r,s),o=t.minFilter;return t.minFilter===Ii&&(t.minFilter=In),new pd(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}class It extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const gd={type:"move"};class Ua{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new It,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new It,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new It,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const x of e.hand.values()){const p=t.getJointPose(x,n),u=this._getHandJoint(l,x);p!==null&&(u.matrix.fromArray(p.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=p.radius),u.visible=p!==null}const h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],f=h.position.distanceTo(d.position),m=.02,_=.005;l.inputState.pinching&&f>m+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&f<=m-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(gd)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new It;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Jo{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ve(e),this.near=t,this.far=n}clone(){return new Jo(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class nu extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new jn,this.environmentIntensity=1,this.environmentRotation=new jn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class _d extends Wt{constructor(e=null,t=1,n=1,r,s,a,o,c,l=cn,h=cn,d,f){super(null,a,o,c,l,h,r,s,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Hl extends Xt{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const ur=new rt,Gl=new rt,Ps=[],Wl=new Wi,xd=new rt,Ur=new Et,Nr=new Xi;class iu extends Et{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Hl(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,xd)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Wi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ur),Wl.copy(e.boundingBox).applyMatrix4(ur),this.boundingBox.union(Wl)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Xi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ur),Nr.copy(e.boundingSphere).applyMatrix4(ur),this.boundingSphere.union(Nr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=n.length+1,a=e*s+1;for(let o=0;o<n.length;o++)n[o]=r[a+o]}raycast(e,t){const n=this.matrixWorld,r=this.count;if(Ur.geometry=this.geometry,Ur.material=this.material,Ur.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Nr.copy(this.boundingSphere),Nr.applyMatrix4(n),e.ray.intersectsSphere(Nr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,ur),Gl.multiplyMatrices(n,ur),Ur.matrixWorld=Gl,Ur.raycast(e,Ps);for(let a=0,o=Ps.length;a<o;a++){const c=Ps[a];c.instanceId=s,c.object=this,t.push(c)}Ps.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Hl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new _d(new Float32Array(r*this.count),r,this.count,Xo,Un));const s=this.morphTexture.source.data.data;let a=0;for(let l=0;l<n.length;l++)a+=n[l];const o=this.geometry.morphTargetsRelative?1:1-a,c=r*e;s[c]=o,s.set(n,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Na=new L,vd=new L,Md=new Fe;class Ri{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=Na.subVectors(n,t).cross(vd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Na),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Md.getNormalMatrix(e),r=this.coplanarPoint(Na).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ti=new Xi,Sd=new Oe(.5,.5),Ls=new L;class Qo{constructor(e=new Ri,t=new Ri,n=new Ri,r=new Ri,s=new Ri,a=new Ri){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Nn,n=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],c=s[2],l=s[3],h=s[4],d=s[5],f=s[6],m=s[7],_=s[8],x=s[9],p=s[10],u=s[11],E=s[12],T=s[13],M=s[14],R=s[15];if(r[0].setComponents(l-a,m-h,u-_,R-E).normalize(),r[1].setComponents(l+a,m+h,u+_,R+E).normalize(),r[2].setComponents(l+o,m+d,u+x,R+T).normalize(),r[3].setComponents(l-o,m-d,u-x,R-T).normalize(),n)r[4].setComponents(c,f,p,M).normalize(),r[5].setComponents(l-c,m-f,u-p,R-M).normalize();else if(r[4].setComponents(l-c,m-f,u-p,R-M).normalize(),t===Nn)r[5].setComponents(l+c,m+f,u+p,R+M).normalize();else if(t===js)r[5].setComponents(c,f,p,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ti.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ti.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ti)}intersectsSprite(e){Ti.center.set(0,0,0);const t=Sd.distanceTo(e.center);return Ti.radius=.7071067811865476+t,Ti.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ti)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(Ls.x=r.normal.x>0?e.max.x:e.min.x,Ls.y=r.normal.y>0?e.max.y:e.min.y,Ls.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ls)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ru extends qi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ve(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Zs=new L,Js=new L,Xl=new rt,Fr=new ta,Ds=new Xi,Fa=new L,ql=new L;class yd extends Tt{constructor(e=new wt,t=new ru){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let r=1,s=t.count;r<s;r++)Zs.fromBufferAttribute(t,r-1),Js.fromBufferAttribute(t,r),n[r]=n[r-1],n[r]+=Zs.distanceTo(Js);e.setAttribute("lineDistance",new at(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ds.copy(n.boundingSphere),Ds.applyMatrix4(r),Ds.radius+=s,e.ray.intersectsSphere(Ds)===!1)return;Xl.copy(r).invert(),Fr.copy(e.ray).applyMatrix4(Xl);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){const m=Math.max(0,a.start),_=Math.min(h.count,a.start+a.count);for(let x=m,p=_-1;x<p;x+=l){const u=h.getX(x),E=h.getX(x+1),T=Is(this,e,Fr,c,u,E,x);T&&t.push(T)}if(this.isLineLoop){const x=h.getX(_-1),p=h.getX(m),u=Is(this,e,Fr,c,x,p,_-1);u&&t.push(u)}}else{const m=Math.max(0,a.start),_=Math.min(f.count,a.start+a.count);for(let x=m,p=_-1;x<p;x+=l){const u=Is(this,e,Fr,c,x,x+1,x);u&&t.push(u)}if(this.isLineLoop){const x=Is(this,e,Fr,c,_-1,m,_-1);x&&t.push(x)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Is(i,e,t,n,r,s,a){const o=i.geometry.attributes.position;if(Zs.fromBufferAttribute(o,r),Js.fromBufferAttribute(o,s),t.distanceSqToSegment(Zs,Js,Fa,ql)>n)return;Fa.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(Fa);if(!(l<e.near||l>e.far))return{distance:l,point:ql.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}const Yl=new L,Kl=new L;class Ed extends yd{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let r=0,s=t.count;r<s;r+=2)Yl.fromBufferAttribute(t,r),Kl.fromBufferAttribute(t,r+1),n[r]=r===0?0:n[r-1],n[r+1]=n[r]+Yl.distanceTo(Kl);e.setAttribute("lineDistance",new at(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class na extends qi{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ve(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const jl=new rt,No=new ta,Us=new Xi,Ns=new L;class el extends Tt{constructor(e=new wt,t=new na){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Us.copy(n.boundingSphere),Us.applyMatrix4(r),Us.radius+=s,e.ray.intersectsSphere(Us)===!1)return;jl.copy(r).invert(),No.copy(e.ray).applyMatrix4(jl);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,d=n.attributes.position;if(l!==null){const f=Math.max(0,a.start),m=Math.min(l.count,a.start+a.count);for(let _=f,x=m;_<x;_++){const p=l.getX(_);Ns.fromBufferAttribute(d,p),$l(Ns,p,c,r,e,t,this)}}else{const f=Math.max(0,a.start),m=Math.min(d.count,a.start+a.count);for(let _=f,x=m;_<x;_++)Ns.fromBufferAttribute(d,_),$l(Ns,_,c,r,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function $l(i,e,t,n,r,s,a){const o=No.distanceSqToPoint(i);if(o<t){const c=new L;No.closestPointToPoint(i,c),c.applyMatrix4(n);const l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;s.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class su extends Wt{constructor(e,t,n=Fi,r,s,a,o=cn,c=cn,l,h=jr,d=1){if(h!==jr&&h!==$r)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:e,height:t,depth:d};super(f,r,s,a,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new $o(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class au extends Wt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Oi extends wt{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],c=[],l=new L,h=new Oe;a.push(0,0,0),o.push(0,0,1),c.push(.5,.5);for(let d=0,f=3;d<=t;d++,f+=3){const m=n+d/t*r;l.x=e*Math.cos(m),l.y=e*Math.sin(m),a.push(l.x,l.y,l.z),o.push(0,0,1),h.x=(a[f]/e+1)/2,h.y=(a[f+1]/e+1)/2,c.push(h.x,h.y)}for(let d=1;d<=t;d++)s.push(d,d+1,0);this.setIndex(s),this.setAttribute("position",new at(a,3)),this.setAttribute("normal",new at(o,3)),this.setAttribute("uv",new at(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Oi(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class jt extends wt{constructor(e=1,t=1,n=1,r=32,s=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:c};const l=this;r=Math.floor(r),s=Math.floor(s);const h=[],d=[],f=[],m=[];let _=0;const x=[],p=n/2;let u=0;E(),a===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(h),this.setAttribute("position",new at(d,3)),this.setAttribute("normal",new at(f,3)),this.setAttribute("uv",new at(m,2));function E(){const M=new L,R=new L;let A=0;const P=(t-e)/n;for(let U=0;U<=s;U++){const y=[],S=U/s,D=S*(t-e)+e;for(let O=0;O<=r;O++){const H=O/r,K=H*c+o,q=Math.sin(K),Y=Math.cos(K);R.x=D*q,R.y=-S*n+p,R.z=D*Y,d.push(R.x,R.y,R.z),M.set(q,P,Y).normalize(),f.push(M.x,M.y,M.z),m.push(H,1-S),y.push(_++)}x.push(y)}for(let U=0;U<r;U++)for(let y=0;y<s;y++){const S=x[y][U],D=x[y+1][U],O=x[y+1][U+1],H=x[y][U+1];(e>0||y!==0)&&(h.push(S,D,H),A+=3),(t>0||y!==s-1)&&(h.push(D,O,H),A+=3)}l.addGroup(u,A,0),u+=A}function T(M){const R=_,A=new Oe,P=new L;let U=0;const y=M===!0?e:t,S=M===!0?1:-1;for(let O=1;O<=r;O++)d.push(0,p*S,0),f.push(0,S,0),m.push(.5,.5),_++;const D=_;for(let O=0;O<=r;O++){const K=O/r*c+o,q=Math.cos(K),Y=Math.sin(K);P.x=y*Y,P.y=p*S,P.z=y*q,d.push(P.x,P.y,P.z),f.push(0,S,0),A.x=q*.5+.5,A.y=Y*.5*S+.5,m.push(A.x,A.y),_++}for(let O=0;O<r;O++){const H=R+O,K=D+O;M===!0?h.push(K,K+1,H):h.push(K+1,K,H),U+=3}l.addGroup(u,U,M===!0?1:2),u+=U}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new jt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class _n extends jt{constructor(e=1,t=1,n=32,r=1,s=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new _n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class ia extends wt{constructor(e=[],t=[],n=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:r};const s=[],a=[];o(r),l(n),h(),this.setAttribute("position",new at(s,3)),this.setAttribute("normal",new at(s.slice(),3)),this.setAttribute("uv",new at(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(E){const T=new L,M=new L,R=new L;for(let A=0;A<t.length;A+=3)m(t[A+0],T),m(t[A+1],M),m(t[A+2],R),c(T,M,R,E)}function c(E,T,M,R){const A=R+1,P=[];for(let U=0;U<=A;U++){P[U]=[];const y=E.clone().lerp(M,U/A),S=T.clone().lerp(M,U/A),D=A-U;for(let O=0;O<=D;O++)O===0&&U===A?P[U][O]=y:P[U][O]=y.clone().lerp(S,O/D)}for(let U=0;U<A;U++)for(let y=0;y<2*(A-U)-1;y++){const S=Math.floor(y/2);y%2===0?(f(P[U][S+1]),f(P[U+1][S]),f(P[U][S])):(f(P[U][S+1]),f(P[U+1][S+1]),f(P[U+1][S]))}}function l(E){const T=new L;for(let M=0;M<s.length;M+=3)T.x=s[M+0],T.y=s[M+1],T.z=s[M+2],T.normalize().multiplyScalar(E),s[M+0]=T.x,s[M+1]=T.y,s[M+2]=T.z}function h(){const E=new L;for(let T=0;T<s.length;T+=3){E.x=s[T+0],E.y=s[T+1],E.z=s[T+2];const M=p(E)/2/Math.PI+.5,R=u(E)/Math.PI+.5;a.push(M,1-R)}_(),d()}function d(){for(let E=0;E<a.length;E+=6){const T=a[E+0],M=a[E+2],R=a[E+4],A=Math.max(T,M,R),P=Math.min(T,M,R);A>.9&&P<.1&&(T<.2&&(a[E+0]+=1),M<.2&&(a[E+2]+=1),R<.2&&(a[E+4]+=1))}}function f(E){s.push(E.x,E.y,E.z)}function m(E,T){const M=E*3;T.x=e[M+0],T.y=e[M+1],T.z=e[M+2]}function _(){const E=new L,T=new L,M=new L,R=new L,A=new Oe,P=new Oe,U=new Oe;for(let y=0,S=0;y<s.length;y+=9,S+=6){E.set(s[y+0],s[y+1],s[y+2]),T.set(s[y+3],s[y+4],s[y+5]),M.set(s[y+6],s[y+7],s[y+8]),A.set(a[S+0],a[S+1]),P.set(a[S+2],a[S+3]),U.set(a[S+4],a[S+5]),R.copy(E).add(T).add(M).divideScalar(3);const D=p(R);x(A,S+0,E,D),x(P,S+2,T,D),x(U,S+4,M,D)}}function x(E,T,M,R){R<0&&E.x===1&&(a[T]=E.x-1),M.x===0&&M.z===0&&(a[T]=R/2/Math.PI+.5)}function p(E){return Math.atan2(E.z,-E.x)}function u(E){return Math.atan2(-E.y,Math.sqrt(E.x*E.x+E.z*E.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ia(e.vertices,e.indices,e.radius,e.details)}}class tl extends ia{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,r=1/n,s=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-n,0,-r,n,0,r,-n,0,r,n,-r,-n,0,-r,n,0,r,-n,0,r,n,0,-n,0,-r,n,0,-r,-n,0,r,n,0,r],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(s,a,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new tl(e.radius,e.detail)}}class $n extends ia{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new $n(e.radius,e.detail)}}class Yi extends wt{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),c=Math.floor(r),l=o+1,h=c+1,d=e/o,f=t/c,m=[],_=[],x=[],p=[];for(let u=0;u<h;u++){const E=u*f-a;for(let T=0;T<l;T++){const M=T*d-s;_.push(M,-E,0),x.push(0,0,1),p.push(T/o),p.push(1-u/c)}}for(let u=0;u<c;u++)for(let E=0;E<o;E++){const T=E+l*u,M=E+l*(u+1),R=E+1+l*(u+1),A=E+1+l*u;m.push(T,M,A),m.push(M,R,A)}this.setIndex(m),this.setAttribute("position",new at(_,3)),this.setAttribute("normal",new at(x,3)),this.setAttribute("uv",new at(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Yi(e.width,e.height,e.widthSegments,e.heightSegments)}}class nl extends wt{constructor(e=.5,t=1,n=32,r=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:s,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);const o=[],c=[],l=[],h=[];let d=e;const f=(t-e)/r,m=new L,_=new Oe;for(let x=0;x<=r;x++){for(let p=0;p<=n;p++){const u=s+p/n*a;m.x=d*Math.cos(u),m.y=d*Math.sin(u),c.push(m.x,m.y,m.z),l.push(0,0,1),_.x=(m.x/t+1)/2,_.y=(m.y/t+1)/2,h.push(_.x,_.y)}d+=f}for(let x=0;x<r;x++){const p=x*(n+1);for(let u=0;u<n;u++){const E=u+p,T=E,M=E+n+1,R=E+n+2,A=E+1;o.push(T,M,A),o.push(M,R,A)}}this.setIndex(o),this.setAttribute("position",new at(c,3)),this.setAttribute("normal",new at(l,3)),this.setAttribute("uv",new at(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new nl(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class Kn extends wt{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const c=Math.min(a+o,Math.PI);let l=0;const h=[],d=new L,f=new L,m=[],_=[],x=[],p=[];for(let u=0;u<=n;u++){const E=[],T=u/n;let M=0;u===0&&a===0?M=.5/t:u===n&&c===Math.PI&&(M=-.5/t);for(let R=0;R<=t;R++){const A=R/t;d.x=-e*Math.cos(r+A*s)*Math.sin(a+T*o),d.y=e*Math.cos(a+T*o),d.z=e*Math.sin(r+A*s)*Math.sin(a+T*o),_.push(d.x,d.y,d.z),f.copy(d).normalize(),x.push(f.x,f.y,f.z),p.push(A+M,1-T),E.push(l++)}h.push(E)}for(let u=0;u<n;u++)for(let E=0;E<t;E++){const T=h[u][E+1],M=h[u][E],R=h[u+1][E],A=h[u+1][E+1];(u!==0||a>0)&&m.push(T,M,A),(u!==n-1||c<Math.PI)&&m.push(M,R,A)}this.setIndex(m),this.setAttribute("position",new at(_,3)),this.setAttribute("normal",new at(x,3)),this.setAttribute("uv",new at(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Kn(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class ss extends wt{constructor(e=1,t=.4,n=12,r=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:s},n=Math.floor(n),r=Math.floor(r);const a=[],o=[],c=[],l=[],h=new L,d=new L,f=new L;for(let m=0;m<=n;m++)for(let _=0;_<=r;_++){const x=_/r*s,p=m/n*Math.PI*2;d.x=(e+t*Math.cos(p))*Math.cos(x),d.y=(e+t*Math.cos(p))*Math.sin(x),d.z=t*Math.sin(p),o.push(d.x,d.y,d.z),h.x=e*Math.cos(x),h.y=e*Math.sin(x),f.subVectors(d,h).normalize(),c.push(f.x,f.y,f.z),l.push(_/r),l.push(m/n)}for(let m=1;m<=n;m++)for(let _=1;_<=r;_++){const x=(r+1)*m+_-1,p=(r+1)*(m-1)+_-1,u=(r+1)*(m-1)+_,E=(r+1)*m+_;a.push(x,p,E),a.push(p,u,E)}this.setIndex(a),this.setAttribute("position",new at(o,3)),this.setAttribute("normal",new at(c,3)),this.setAttribute("uv",new at(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ss(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class Td extends qi{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Ve(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ve(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=qc,this.normalScale=new Oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}class bd extends qi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=vh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Ad extends qi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class il extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ve(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}class wd extends il{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ve(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const Oa=new rt,Zl=new L,Jl=new L;class ou{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Oe(512,512),this.mapType=Fn,this.map=null,this.mapPass=null,this.matrix=new rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Qo,this._frameExtents=new Oe(1,1),this._viewportCount=1,this._viewports=[new nt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Zl.setFromMatrixPosition(e.matrixWorld),t.position.copy(Zl),Jl.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Jl),t.updateMatrixWorld(),Oa.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Oa,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Oa)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Ql=new rt,Or=new L,Ba=new L;class Rd extends ou{constructor(){super(new rn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Oe(4,2),this._viewportCount=6,this._viewports=[new nt(2,1,1,1),new nt(0,1,1,1),new nt(3,1,1,1),new nt(1,1,1,1),new nt(3,0,1,1),new nt(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,r=this.matrix,s=e.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),Or.setFromMatrixPosition(e.matrixWorld),n.position.copy(Or),Ba.copy(n.position),Ba.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Ba),n.updateMatrixWorld(),r.makeTranslation(-Or.x,-Or.y,-Or.z),Ql.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ql,n.coordinateSystem,n.reversedDepth)}}class ra extends il{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=r,this.shadow=new Rd}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class rl extends eu{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,a=s+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Cd extends ou{constructor(){super(new rl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Pd extends il{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.shadow=new Cd}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Ld extends rn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class Dd{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}const ec=new rt;class Id{constructor(e,t,n=0,r=1/0){this.ray=new ta(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Zo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return ec.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ec),this}intersectObject(e,t=!0,n=[]){return Fo(e,this,n,t),n.sort(tc),n}intersectObjects(e,t=!0,n=[]){for(let r=0,s=e.length;r<s;r++)Fo(e[r],this,n,t);return n.sort(tc),n}}function tc(i,e){return i.distance-e.distance}function Fo(i,e,t,n){let r=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(r=!1),r===!0&&n===!0){const s=i.children;for(let a=0,o=s.length;a<o;a++)Fo(s[a],e,t,!0)}}function nc(i,e,t,n){const r=Ud(n);switch(t){case Gc:return i*e;case Xo:return i*e/r.components*r.byteLength;case qo:return i*e/r.components*r.byteLength;case Xc:return i*e*2/r.components*r.byteLength;case Yo:return i*e*2/r.components*r.byteLength;case Wc:return i*e*3/r.components*r.byteLength;case bn:return i*e*4/r.components*r.byteLength;case Ko:return i*e*4/r.components*r.byteLength;case ks:case Vs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Hs:case Gs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case oo:case co:return Math.max(i,16)*Math.max(e,8)/4;case ao:case lo:return Math.max(i,8)*Math.max(e,8)/2;case uo:case ho:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case fo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case po:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case mo:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case go:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case _o:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case xo:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case vo:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Mo:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case So:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case yo:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Eo:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case To:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case bo:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Ao:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case wo:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Ro:case Co:case Po:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Lo:case Do:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Io:case Uo:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Ud(i){switch(i){case Fn:case zc:return{byteLength:1,components:1};case Yr:case kc:case is:return{byteLength:2,components:1};case Go:case Wo:return{byteLength:2,components:4};case Fi:case Ho:case Un:return{byteLength:4,components:1};case Vc:case Hc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Vo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Vo);function lu(){let i=null,e=!1,t=null,n=null;function r(s,a){t(s,a),n=i.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function Nd(i){const e=new WeakMap;function t(o,c){const l=o.array,h=o.usage,d=l.byteLength,f=i.createBuffer();i.bindBuffer(c,f),i.bufferData(c,l,h),o.onUploadCallback();let m;if(l instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)m=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)m=i.SHORT;else if(l instanceof Uint32Array)m=i.UNSIGNED_INT;else if(l instanceof Int32Array)m=i.INT;else if(l instanceof Int8Array)m=i.BYTE;else if(l instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:m,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,c,l){const h=c.array,d=c.updateRanges;if(i.bindBuffer(l,o),d.length===0)i.bufferSubData(l,0,h);else{d.sort((m,_)=>m.start-_.start);let f=0;for(let m=1;m<d.length;m++){const _=d[f],x=d[m];x.start<=_.start+_.count+1?_.count=Math.max(_.count,x.start+x.count-_.start):(++f,d[f]=x)}d.length=f+1;for(let m=0,_=d.length;m<_;m++){const x=d[m];i.bufferSubData(l,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:r,remove:s,update:a}}var Fd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Od=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Bd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,zd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,kd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Vd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Hd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Gd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Wd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Xd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,qd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Yd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Kd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,jd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,$d=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Zd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Jd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Qd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ef=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,tf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,nf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,rf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,sf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,af=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,of=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,lf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,cf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,uf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,hf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,df=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ff="gl_FragColor = linearToOutputTexel( gl_FragColor );",pf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,mf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,gf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,_f=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,xf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,vf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Mf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Sf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,yf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ef=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Tf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,bf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Af=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,wf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Rf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Cf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Pf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Lf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Df=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,If=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Uf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Nf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ff=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Of=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Bf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,zf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,kf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Vf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Hf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Gf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Wf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Xf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,qf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Yf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Kf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,jf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$f=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Zf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Jf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Qf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ep=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,tp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,np=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ip=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,rp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,sp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,ap=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,op=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,lp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,cp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,up=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,hp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,dp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,fp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,pp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,mp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,gp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,_p=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,xp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,vp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Mp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Sp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,yp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ep=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Tp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,bp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Ap=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,wp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Rp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Cp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Pp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Lp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Dp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ip=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Up=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Np=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Fp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Op=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,kp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Vp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Gp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Wp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Xp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,qp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Yp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kp=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,jp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$p=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Zp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,em=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,tm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,im=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,rm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,sm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,am=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,om=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,um=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,hm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,dm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,pm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,mm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ze={alphahash_fragment:Fd,alphahash_pars_fragment:Od,alphamap_fragment:Bd,alphamap_pars_fragment:zd,alphatest_fragment:kd,alphatest_pars_fragment:Vd,aomap_fragment:Hd,aomap_pars_fragment:Gd,batching_pars_vertex:Wd,batching_vertex:Xd,begin_vertex:qd,beginnormal_vertex:Yd,bsdfs:Kd,iridescence_fragment:jd,bumpmap_pars_fragment:$d,clipping_planes_fragment:Zd,clipping_planes_pars_fragment:Jd,clipping_planes_pars_vertex:Qd,clipping_planes_vertex:ef,color_fragment:tf,color_pars_fragment:nf,color_pars_vertex:rf,color_vertex:sf,common:af,cube_uv_reflection_fragment:of,defaultnormal_vertex:lf,displacementmap_pars_vertex:cf,displacementmap_vertex:uf,emissivemap_fragment:hf,emissivemap_pars_fragment:df,colorspace_fragment:ff,colorspace_pars_fragment:pf,envmap_fragment:mf,envmap_common_pars_fragment:gf,envmap_pars_fragment:_f,envmap_pars_vertex:xf,envmap_physical_pars_fragment:Cf,envmap_vertex:vf,fog_vertex:Mf,fog_pars_vertex:Sf,fog_fragment:yf,fog_pars_fragment:Ef,gradientmap_pars_fragment:Tf,lightmap_pars_fragment:bf,lights_lambert_fragment:Af,lights_lambert_pars_fragment:wf,lights_pars_begin:Rf,lights_toon_fragment:Pf,lights_toon_pars_fragment:Lf,lights_phong_fragment:Df,lights_phong_pars_fragment:If,lights_physical_fragment:Uf,lights_physical_pars_fragment:Nf,lights_fragment_begin:Ff,lights_fragment_maps:Of,lights_fragment_end:Bf,logdepthbuf_fragment:zf,logdepthbuf_pars_fragment:kf,logdepthbuf_pars_vertex:Vf,logdepthbuf_vertex:Hf,map_fragment:Gf,map_pars_fragment:Wf,map_particle_fragment:Xf,map_particle_pars_fragment:qf,metalnessmap_fragment:Yf,metalnessmap_pars_fragment:Kf,morphinstance_vertex:jf,morphcolor_vertex:$f,morphnormal_vertex:Zf,morphtarget_pars_vertex:Jf,morphtarget_vertex:Qf,normal_fragment_begin:ep,normal_fragment_maps:tp,normal_pars_fragment:np,normal_pars_vertex:ip,normal_vertex:rp,normalmap_pars_fragment:sp,clearcoat_normal_fragment_begin:ap,clearcoat_normal_fragment_maps:op,clearcoat_pars_fragment:lp,iridescence_pars_fragment:cp,opaque_fragment:up,packing:hp,premultiplied_alpha_fragment:dp,project_vertex:fp,dithering_fragment:pp,dithering_pars_fragment:mp,roughnessmap_fragment:gp,roughnessmap_pars_fragment:_p,shadowmap_pars_fragment:xp,shadowmap_pars_vertex:vp,shadowmap_vertex:Mp,shadowmask_pars_fragment:Sp,skinbase_vertex:yp,skinning_pars_vertex:Ep,skinning_vertex:Tp,skinnormal_vertex:bp,specularmap_fragment:Ap,specularmap_pars_fragment:wp,tonemapping_fragment:Rp,tonemapping_pars_fragment:Cp,transmission_fragment:Pp,transmission_pars_fragment:Lp,uv_pars_fragment:Dp,uv_pars_vertex:Ip,uv_vertex:Up,worldpos_vertex:Np,background_vert:Fp,background_frag:Op,backgroundCube_vert:Bp,backgroundCube_frag:zp,cube_vert:kp,cube_frag:Vp,depth_vert:Hp,depth_frag:Gp,distanceRGBA_vert:Wp,distanceRGBA_frag:Xp,equirect_vert:qp,equirect_frag:Yp,linedashed_vert:Kp,linedashed_frag:jp,meshbasic_vert:$p,meshbasic_frag:Zp,meshlambert_vert:Jp,meshlambert_frag:Qp,meshmatcap_vert:em,meshmatcap_frag:tm,meshnormal_vert:nm,meshnormal_frag:im,meshphong_vert:rm,meshphong_frag:sm,meshphysical_vert:am,meshphysical_frag:om,meshtoon_vert:lm,meshtoon_frag:cm,points_vert:um,points_frag:hm,shadow_vert:dm,shadow_frag:fm,sprite_vert:pm,sprite_frag:mm},oe={common:{diffuse:{value:new Ve(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},envMapRotation:{value:new Fe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new Oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ve(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ve(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new Ve(16777215)},opacity:{value:1},center:{value:new Oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},Pn={basic:{uniforms:Ht([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.fog]),vertexShader:ze.meshbasic_vert,fragmentShader:ze.meshbasic_frag},lambert:{uniforms:Ht([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new Ve(0)}}]),vertexShader:ze.meshlambert_vert,fragmentShader:ze.meshlambert_frag},phong:{uniforms:Ht([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new Ve(0)},specular:{value:new Ve(1118481)},shininess:{value:30}}]),vertexShader:ze.meshphong_vert,fragmentShader:ze.meshphong_frag},standard:{uniforms:Ht([oe.common,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.roughnessmap,oe.metalnessmap,oe.fog,oe.lights,{emissive:{value:new Ve(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag},toon:{uniforms:Ht([oe.common,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.gradientmap,oe.fog,oe.lights,{emissive:{value:new Ve(0)}}]),vertexShader:ze.meshtoon_vert,fragmentShader:ze.meshtoon_frag},matcap:{uniforms:Ht([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,{matcap:{value:null}}]),vertexShader:ze.meshmatcap_vert,fragmentShader:ze.meshmatcap_frag},points:{uniforms:Ht([oe.points,oe.fog]),vertexShader:ze.points_vert,fragmentShader:ze.points_frag},dashed:{uniforms:Ht([oe.common,oe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ze.linedashed_vert,fragmentShader:ze.linedashed_frag},depth:{uniforms:Ht([oe.common,oe.displacementmap]),vertexShader:ze.depth_vert,fragmentShader:ze.depth_frag},normal:{uniforms:Ht([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,{opacity:{value:1}}]),vertexShader:ze.meshnormal_vert,fragmentShader:ze.meshnormal_frag},sprite:{uniforms:Ht([oe.sprite,oe.fog]),vertexShader:ze.sprite_vert,fragmentShader:ze.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ze.background_vert,fragmentShader:ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Fe}},vertexShader:ze.backgroundCube_vert,fragmentShader:ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ze.cube_vert,fragmentShader:ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ze.equirect_vert,fragmentShader:ze.equirect_frag},distanceRGBA:{uniforms:Ht([oe.common,oe.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ze.distanceRGBA_vert,fragmentShader:ze.distanceRGBA_frag},shadow:{uniforms:Ht([oe.lights,oe.fog,{color:{value:new Ve(0)},opacity:{value:1}}]),vertexShader:ze.shadow_vert,fragmentShader:ze.shadow_frag}};Pn.physical={uniforms:Ht([Pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new Oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new Ve(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new Oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new Ve(0)},specularColor:{value:new Ve(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new Oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag};const Fs={r:0,b:0,g:0},bi=new jn,gm=new rt;function _m(i,e,t,n,r,s,a){const o=new Ve(0);let c=s===!0?0:1,l,h,d=null,f=0,m=null;function _(T){let M=T.isScene===!0?T.background:null;return M&&M.isTexture&&(M=(T.backgroundBlurriness>0?t:e).get(M)),M}function x(T){let M=!1;const R=_(T);R===null?u(o,c):R&&R.isColor&&(u(R,1),M=!0);const A=i.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,a):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(T,M){const R=_(M);R&&(R.isCubeTexture||R.mapping===ea)?(h===void 0&&(h=new Et(new Kt(1,1,1),new On({name:"BackgroundCubeMaterial",uniforms:Sr(Pn.backgroundCube.uniforms),vertexShader:Pn.backgroundCube.vertexShader,fragmentShader:Pn.backgroundCube.fragmentShader,side:Bt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(A,P,U){this.matrixWorld.copyPosition(U.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(h)),bi.copy(M.backgroundRotation),bi.x*=-1,bi.y*=-1,bi.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(bi.y*=-1,bi.z*=-1),h.material.uniforms.envMap.value=R,h.material.uniforms.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(gm.makeRotationFromEuler(bi)),h.material.toneMapped=Ke.getTransfer(R.colorSpace)!==et,(d!==R||f!==R.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,d=R,f=R.version,m=i.toneMapping),h.layers.enableAll(),T.unshift(h,h.geometry,h.material,0,0,null)):R&&R.isTexture&&(l===void 0&&(l=new Et(new Yi(2,2),new On({name:"BackgroundMaterial",uniforms:Sr(Pn.background.uniforms),vertexShader:Pn.background.vertexShader,fragmentShader:Pn.background.fragmentShader,side:pi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=R,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=Ke.getTransfer(R.colorSpace)!==et,R.matrixAutoUpdate===!0&&R.updateMatrix(),l.material.uniforms.uvTransform.value.copy(R.matrix),(d!==R||f!==R.version||m!==i.toneMapping)&&(l.material.needsUpdate=!0,d=R,f=R.version,m=i.toneMapping),l.layers.enableAll(),T.unshift(l,l.geometry,l.material,0,0,null))}function u(T,M){T.getRGB(Fs,Qc(i)),n.buffers.color.setClear(Fs.r,Fs.g,Fs.b,M,a)}function E(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(T,M=1){o.set(T),c=M,u(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(T){c=T,u(o,c)},render:x,addToRenderList:p,dispose:E}}function xm(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=f(null);let s=r,a=!1;function o(S,D,O,H,K){let q=!1;const Y=d(H,O,D);s!==Y&&(s=Y,l(s.object)),q=m(S,H,O,K),q&&_(S,H,O,K),K!==null&&e.update(K,i.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,M(S,D,O,H),K!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(K).buffer))}function c(){return i.createVertexArray()}function l(S){return i.bindVertexArray(S)}function h(S){return i.deleteVertexArray(S)}function d(S,D,O){const H=O.wireframe===!0;let K=n[S.id];K===void 0&&(K={},n[S.id]=K);let q=K[D.id];q===void 0&&(q={},K[D.id]=q);let Y=q[H];return Y===void 0&&(Y=f(c()),q[H]=Y),Y}function f(S){const D=[],O=[],H=[];for(let K=0;K<t;K++)D[K]=0,O[K]=0,H[K]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:O,attributeDivisors:H,object:S,attributes:{},index:null}}function m(S,D,O,H){const K=s.attributes,q=D.attributes;let Y=0;const J=O.getAttributes();for(const G in J)if(J[G].location>=0){const de=K[G];let be=q[G];if(be===void 0&&(G==="instanceMatrix"&&S.instanceMatrix&&(be=S.instanceMatrix),G==="instanceColor"&&S.instanceColor&&(be=S.instanceColor)),de===void 0||de.attribute!==be||be&&de.data!==be.data)return!0;Y++}return s.attributesNum!==Y||s.index!==H}function _(S,D,O,H){const K={},q=D.attributes;let Y=0;const J=O.getAttributes();for(const G in J)if(J[G].location>=0){let de=q[G];de===void 0&&(G==="instanceMatrix"&&S.instanceMatrix&&(de=S.instanceMatrix),G==="instanceColor"&&S.instanceColor&&(de=S.instanceColor));const be={};be.attribute=de,de&&de.data&&(be.data=de.data),K[G]=be,Y++}s.attributes=K,s.attributesNum=Y,s.index=H}function x(){const S=s.newAttributes;for(let D=0,O=S.length;D<O;D++)S[D]=0}function p(S){u(S,0)}function u(S,D){const O=s.newAttributes,H=s.enabledAttributes,K=s.attributeDivisors;O[S]=1,H[S]===0&&(i.enableVertexAttribArray(S),H[S]=1),K[S]!==D&&(i.vertexAttribDivisor(S,D),K[S]=D)}function E(){const S=s.newAttributes,D=s.enabledAttributes;for(let O=0,H=D.length;O<H;O++)D[O]!==S[O]&&(i.disableVertexAttribArray(O),D[O]=0)}function T(S,D,O,H,K,q,Y){Y===!0?i.vertexAttribIPointer(S,D,O,K,q):i.vertexAttribPointer(S,D,O,H,K,q)}function M(S,D,O,H){x();const K=H.attributes,q=O.getAttributes(),Y=D.defaultAttributeValues;for(const J in q){const G=q[J];if(G.location>=0){let le=K[J];if(le===void 0&&(J==="instanceMatrix"&&S.instanceMatrix&&(le=S.instanceMatrix),J==="instanceColor"&&S.instanceColor&&(le=S.instanceColor)),le!==void 0){const de=le.normalized,be=le.itemSize,He=e.get(le);if(He===void 0)continue;const ot=He.buffer,ht=He.type,$e=He.bytesPerElement,j=ht===i.INT||ht===i.UNSIGNED_INT||le.gpuType===Ho;if(le.isInterleavedBufferAttribute){const Q=le.data,me=Q.stride,De=le.offset;if(Q.isInstancedInterleavedBuffer){for(let Te=0;Te<G.locationSize;Te++)u(G.location+Te,Q.meshPerAttribute);S.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let Te=0;Te<G.locationSize;Te++)p(G.location+Te);i.bindBuffer(i.ARRAY_BUFFER,ot);for(let Te=0;Te<G.locationSize;Te++)T(G.location+Te,be/G.locationSize,ht,de,me*$e,(De+be/G.locationSize*Te)*$e,j)}else{if(le.isInstancedBufferAttribute){for(let Q=0;Q<G.locationSize;Q++)u(G.location+Q,le.meshPerAttribute);S.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Q=0;Q<G.locationSize;Q++)p(G.location+Q);i.bindBuffer(i.ARRAY_BUFFER,ot);for(let Q=0;Q<G.locationSize;Q++)T(G.location+Q,be/G.locationSize,ht,de,be*$e,be/G.locationSize*Q*$e,j)}}else if(Y!==void 0){const de=Y[J];if(de!==void 0)switch(de.length){case 2:i.vertexAttrib2fv(G.location,de);break;case 3:i.vertexAttrib3fv(G.location,de);break;case 4:i.vertexAttrib4fv(G.location,de);break;default:i.vertexAttrib1fv(G.location,de)}}}}E()}function R(){U();for(const S in n){const D=n[S];for(const O in D){const H=D[O];for(const K in H)h(H[K].object),delete H[K];delete D[O]}delete n[S]}}function A(S){if(n[S.id]===void 0)return;const D=n[S.id];for(const O in D){const H=D[O];for(const K in H)h(H[K].object),delete H[K];delete D[O]}delete n[S.id]}function P(S){for(const D in n){const O=n[D];if(O[S.id]===void 0)continue;const H=O[S.id];for(const K in H)h(H[K].object),delete H[K];delete O[S.id]}}function U(){y(),a=!0,s!==r&&(s=r,l(s.object))}function y(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:U,resetDefaultState:y,dispose:R,releaseStatesOfGeometry:A,releaseStatesOfProgram:P,initAttributes:x,enableAttribute:p,disableUnusedAttributes:E}}function vm(i,e,t){let n;function r(l){n=l}function s(l,h){i.drawArrays(n,l,h),t.update(h,n,1)}function a(l,h,d){d!==0&&(i.drawArraysInstanced(n,l,h,d),t.update(h,n,d))}function o(l,h,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,d);let m=0;for(let _=0;_<d;_++)m+=h[_];t.update(m,n,1)}function c(l,h,d,f){if(d===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<l.length;_++)a(l[_],h[_],f[_]);else{m.multiDrawArraysInstancedWEBGL(n,l,0,h,0,f,0,d);let _=0;for(let x=0;x<d;x++)_+=h[x]*f[x];t.update(_,n,1)}}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=c}function Mm(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const P=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(P){return!(P!==bn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(P){const U=P===is&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(P!==Fn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==Un&&!U)}function c(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const d=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),E=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=_>0,A=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:m,maxVertexTextures:_,maxTextureSize:x,maxCubemapSize:p,maxAttributes:u,maxVertexUniforms:E,maxVaryings:T,maxFragmentUniforms:M,vertexTextures:R,maxSamples:A}}function Sm(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new Ri,o=new Fe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){const m=d.length!==0||f||n!==0||r;return r=f,n=d.length,m},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,f){t=h(d,f,0)},this.setState=function(d,f,m){const _=d.clippingPlanes,x=d.clipIntersection,p=d.clipShadows,u=i.get(d);if(!r||_===null||_.length===0||s&&!p)s?h(null):l();else{const E=s?0:n,T=E*4;let M=u.clippingState||null;c.value=M,M=h(_,f,T,m);for(let R=0;R!==T;++R)M[R]=t[R];u.clippingState=M,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=E}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,f,m,_){const x=d!==null?d.length:0;let p=null;if(x!==0){if(p=c.value,_!==!0||p===null){const u=m+x*4,E=f.matrixWorldInverse;o.getNormalMatrix(E),(p===null||p.length<u)&&(p=new Float32Array(u));for(let T=0,M=m;T!==x;++T,M+=4)a.copy(d[T]).applyMatrix4(E,o),a.normal.toArray(p,M),p[M+3]=a.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function ym(i){let e=new WeakMap;function t(a,o){return o===no?a.mapping=xr:o===io&&(a.mapping=vr),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===no||o===io)if(e.has(a)){const c=e.get(a).texture;return t(c,a.mapping)}else{const c=a.image;if(c&&c.height>0){const l=new md(c.height);return l.fromEquirectangularTexture(i,a),e.set(a,l),a.addEventListener("dispose",r),t(l.texture,a.mapping)}else return null}}return a}function r(a){const o=a.target;o.removeEventListener("dispose",r);const c=e.get(o);c!==void 0&&(e.delete(o),c.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}const fr=4,ic=[.125,.215,.35,.446,.526,.582],Li=20,za=new rl,rc=new Ve;let ka=null,Va=0,Ha=0,Ga=!1;const Ci=(1+Math.sqrt(5))/2,hr=1/Ci,sc=[new L(-Ci,hr,0),new L(Ci,hr,0),new L(-hr,0,Ci),new L(hr,0,Ci),new L(0,Ci,-hr),new L(0,Ci,hr),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],Em=new L;class ac{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100,s={}){const{size:a=256,position:o=Em}=s;ka=this._renderer.getRenderTarget(),Va=this._renderer.getActiveCubeFace(),Ha=this._renderer.getActiveMipmapLevel(),Ga=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,r,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=cc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=lc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ka,Va,Ha),this._renderer.xr.enabled=Ga,e.scissorTest=!1,Os(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===xr||e.mapping===vr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ka=this._renderer.getRenderTarget(),Va=this._renderer.getActiveCubeFace(),Ha=this._renderer.getActiveMipmapLevel(),Ga=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:In,minFilter:In,generateMipmaps:!1,type:is,format:bn,colorSpace:Mr,depthBuffer:!1},r=oc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=oc(e,t,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Tm(s)),this._blurMaterial=bm(s,e,t)}return r}_compileMaterial(e){const t=new Et(this._lodPlanes[0],e);this._renderer.compile(t,za)}_sceneToCubeUV(e,t,n,r,s){const c=new rn(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,f=d.autoClear,m=d.toneMapping;d.getClearColor(rc),d.toneMapping=hi,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null));const x=new un({name:"PMREM.Background",side:Bt,depthWrite:!1,depthTest:!1}),p=new Et(new Kt,x);let u=!1;const E=e.background;E?E.isColor&&(x.color.copy(E),e.background=null,u=!0):(x.color.copy(rc),u=!0);for(let T=0;T<6;T++){const M=T%3;M===0?(c.up.set(0,l[T],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+h[T],s.y,s.z)):M===1?(c.up.set(0,0,l[T]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+h[T],s.z)):(c.up.set(0,l[T],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+h[T]));const R=this._cubeSize;Os(r,M*R,T>2?R:0,R,R),d.setRenderTarget(r),u&&d.render(p,c),d.render(e,c)}p.geometry.dispose(),p.material.dispose(),d.toneMapping=m,d.autoClear=f,e.background=E}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===xr||e.mapping===vr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=cc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=lc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=new Et(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;const c=this._cubeSize;Os(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,za)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=sc[(r-s-1)%sc.length];this._blur(e,s-1,s,a,o)}t.autoClear=n}_blur(e,t,n,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,"latitudinal",s),this._halfBlur(a,e,n,n,r,"longitudinal",s)}_halfBlur(e,t,n,r,s,a,o){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new Et(this._lodPlanes[r],l),f=l.uniforms,m=this._sizeLods[n]-1,_=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*Li-1),x=s/_,p=isFinite(s)?1+Math.floor(h*x):Li;p>Li&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Li}`);const u=[];let E=0;for(let P=0;P<Li;++P){const U=P/x,y=Math.exp(-U*U/2);u.push(y),P===0?E+=y:P<p&&(E+=2*y)}for(let P=0;P<u.length;P++)u[P]=u[P]/E;f.envMap.value=e.texture,f.samples.value=p,f.weights.value=u,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);const{_lodMax:T}=this;f.dTheta.value=_,f.mipInt.value=T-n;const M=this._sizeLods[r],R=3*M*(r>T-fr?r-T+fr:0),A=4*(this._cubeSize-M);Os(t,R,A,3*M,2*M),c.setRenderTarget(t),c.render(d,za)}}function Tm(i){const e=[],t=[],n=[];let r=i;const s=i-fr+1+ic.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);t.push(o);let c=1/o;a>i-fr?c=ic[a-i+fr-1]:a===0&&(c=0),n.push(c);const l=1/(o-2),h=-l,d=1+l,f=[h,h,d,h,d,d,h,h,d,d,h,d],m=6,_=6,x=3,p=2,u=1,E=new Float32Array(x*_*m),T=new Float32Array(p*_*m),M=new Float32Array(u*_*m);for(let A=0;A<m;A++){const P=A%3*2/3-1,U=A>2?0:-1,y=[P,U,0,P+2/3,U,0,P+2/3,U+1,0,P,U,0,P+2/3,U+1,0,P,U+1,0];E.set(y,x*_*A),T.set(f,p*_*A);const S=[A,A,A,A,A,A];M.set(S,u*_*A)}const R=new wt;R.setAttribute("position",new Xt(E,x)),R.setAttribute("uv",new Xt(T,p)),R.setAttribute("faceIndex",new Xt(M,u)),e.push(R),r>fr&&r--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function oc(i,e,t){const n=new mi(i,e,t);return n.texture.mapping=ea,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Os(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function bm(i,e,t){const n=new Float32Array(Li),r=new L(0,1,0);return new On({name:"SphericalGaussianBlur",defines:{n:Li,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:sl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function lc(){return new On({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:sl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function cc(){return new On({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:sl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function sl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Am(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const c=o.mapping,l=c===no||c===io,h=c===xr||c===vr;if(l||h){let d=e.get(o);const f=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==f)return t===null&&(t=new ac(i)),d=l?t.fromEquirectangular(o,d):t.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,e.set(o,d),d.texture;if(d!==void 0)return d.texture;{const m=o.image;return l&&m&&m.height>0||h&&m&&r(m)?(t===null&&(t=new ac(i)),d=l?t.fromEquirectangular(o):t.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,e.set(o,d),o.addEventListener("dispose",s),d.texture):null}}}return o}function r(o){let c=0;const l=6;for(let h=0;h<l;h++)o[h]!==void 0&&c++;return c===l}function s(o){const c=o.target;c.removeEventListener("dispose",s);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function wm(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&Jr("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function Rm(i,e,t,n){const r={},s=new WeakMap;function a(d){const f=d.target;f.index!==null&&e.remove(f.index);for(const _ in f.attributes)e.remove(f.attributes[_]);f.removeEventListener("dispose",a),delete r[f.id];const m=s.get(f);m&&(e.remove(m),s.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function o(d,f){return r[f.id]===!0||(f.addEventListener("dispose",a),r[f.id]=!0,t.memory.geometries++),f}function c(d){const f=d.attributes;for(const m in f)e.update(f[m],i.ARRAY_BUFFER)}function l(d){const f=[],m=d.index,_=d.attributes.position;let x=0;if(m!==null){const E=m.array;x=m.version;for(let T=0,M=E.length;T<M;T+=3){const R=E[T+0],A=E[T+1],P=E[T+2];f.push(R,A,A,P,P,R)}}else if(_!==void 0){const E=_.array;x=_.version;for(let T=0,M=E.length/3-1;T<M;T+=3){const R=T+0,A=T+1,P=T+2;f.push(R,A,A,P,P,R)}}else return;const p=new(Kc(f)?Jc:Zc)(f,1);p.version=x;const u=s.get(d);u&&e.remove(u),s.set(d,p)}function h(d){const f=s.get(d);if(f){const m=d.index;m!==null&&f.version<m.version&&l(d)}else l(d);return s.get(d)}return{get:o,update:c,getWireframeAttribute:h}}function Cm(i,e,t){let n;function r(f){n=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function c(f,m){i.drawElements(n,m,s,f*a),t.update(m,n,1)}function l(f,m,_){_!==0&&(i.drawElementsInstanced(n,m,s,f*a,_),t.update(m,n,_))}function h(f,m,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,s,f,0,_);let p=0;for(let u=0;u<_;u++)p+=m[u];t.update(p,n,1)}function d(f,m,_,x){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let u=0;u<f.length;u++)l(f[u]/a,m[u],x[u]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,s,f,0,x,0,_);let u=0;for(let E=0;E<_;E++)u+=m[E]*x[E];t.update(u,n,1)}}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function Pm(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function Lm(i,e,t){const n=new WeakMap,r=new nt;function s(a,o,c){const l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let f=n.get(o);if(f===void 0||f.count!==d){let S=function(){U.dispose(),n.delete(o),o.removeEventListener("dispose",S)};var m=S;f!==void 0&&f.texture.dispose();const _=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,p=o.morphAttributes.color!==void 0,u=o.morphAttributes.position||[],E=o.morphAttributes.normal||[],T=o.morphAttributes.color||[];let M=0;_===!0&&(M=1),x===!0&&(M=2),p===!0&&(M=3);let R=o.attributes.position.count*M,A=1;R>e.maxTextureSize&&(A=Math.ceil(R/e.maxTextureSize),R=e.maxTextureSize);const P=new Float32Array(R*A*4*d),U=new jc(P,R,A,d);U.type=Un,U.needsUpdate=!0;const y=M*4;for(let D=0;D<d;D++){const O=u[D],H=E[D],K=T[D],q=R*A*4*D;for(let Y=0;Y<O.count;Y++){const J=Y*y;_===!0&&(r.fromBufferAttribute(O,Y),P[q+J+0]=r.x,P[q+J+1]=r.y,P[q+J+2]=r.z,P[q+J+3]=0),x===!0&&(r.fromBufferAttribute(H,Y),P[q+J+4]=r.x,P[q+J+5]=r.y,P[q+J+6]=r.z,P[q+J+7]=0),p===!0&&(r.fromBufferAttribute(K,Y),P[q+J+8]=r.x,P[q+J+9]=r.y,P[q+J+10]=r.z,P[q+J+11]=K.itemSize===4?r.w:1)}}f={count:d,texture:U,size:new Oe(R,A)},n.set(o,f),o.addEventListener("dispose",S)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let _=0;for(let p=0;p<l.length;p++)_+=l[p];const x=o.morphTargetsRelative?1:1-_;c.getUniforms().setValue(i,"morphTargetBaseInfluence",x),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:s}}function Dm(i,e,t,n){let r=new WeakMap;function s(c){const l=n.render.frame,h=c.geometry,d=e.get(c,h);if(r.get(d)!==l&&(e.update(d),r.set(d,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),r.get(c)!==l&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,l))),c.isSkinnedMesh){const f=c.skeleton;r.get(f)!==l&&(f.update(),r.set(f,l))}return d}function a(){r=new WeakMap}function o(c){const l=c.target;l.removeEventListener("dispose",o),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:s,dispose:a}}const cu=new Wt,uc=new su(1,1),uu=new jc,hu=new Jh,du=new tu,hc=[],dc=[],fc=new Float32Array(16),pc=new Float32Array(9),mc=new Float32Array(4);function Ar(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=hc[r];if(s===void 0&&(s=new Float32Array(r),hc[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function bt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function At(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function sa(i,e){let t=dc[e];t===void 0&&(t=new Int32Array(e),dc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Im(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Um(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;i.uniform2fv(this.addr,e),At(t,e)}}function Nm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(bt(t,e))return;i.uniform3fv(this.addr,e),At(t,e)}}function Fm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;i.uniform4fv(this.addr,e),At(t,e)}}function Om(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(bt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),At(t,e)}else{if(bt(t,n))return;mc.set(n),i.uniformMatrix2fv(this.addr,!1,mc),At(t,n)}}function Bm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(bt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),At(t,e)}else{if(bt(t,n))return;pc.set(n),i.uniformMatrix3fv(this.addr,!1,pc),At(t,n)}}function zm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(bt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),At(t,e)}else{if(bt(t,n))return;fc.set(n),i.uniformMatrix4fv(this.addr,!1,fc),At(t,n)}}function km(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Vm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;i.uniform2iv(this.addr,e),At(t,e)}}function Hm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;i.uniform3iv(this.addr,e),At(t,e)}}function Gm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;i.uniform4iv(this.addr,e),At(t,e)}}function Wm(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Xm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;i.uniform2uiv(this.addr,e),At(t,e)}}function qm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;i.uniform3uiv(this.addr,e),At(t,e)}}function Ym(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;i.uniform4uiv(this.addr,e),At(t,e)}}function Km(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(uc.compareFunction=Yc,s=uc):s=cu,t.setTexture2D(e||s,r)}function jm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||hu,r)}function $m(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||du,r)}function Zm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||uu,r)}function Jm(i){switch(i){case 5126:return Im;case 35664:return Um;case 35665:return Nm;case 35666:return Fm;case 35674:return Om;case 35675:return Bm;case 35676:return zm;case 5124:case 35670:return km;case 35667:case 35671:return Vm;case 35668:case 35672:return Hm;case 35669:case 35673:return Gm;case 5125:return Wm;case 36294:return Xm;case 36295:return qm;case 36296:return Ym;case 35678:case 36198:case 36298:case 36306:case 35682:return Km;case 35679:case 36299:case 36307:return jm;case 35680:case 36300:case 36308:case 36293:return $m;case 36289:case 36303:case 36311:case 36292:return Zm}}function Qm(i,e){i.uniform1fv(this.addr,e)}function eg(i,e){const t=Ar(e,this.size,2);i.uniform2fv(this.addr,t)}function tg(i,e){const t=Ar(e,this.size,3);i.uniform3fv(this.addr,t)}function ng(i,e){const t=Ar(e,this.size,4);i.uniform4fv(this.addr,t)}function ig(i,e){const t=Ar(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function rg(i,e){const t=Ar(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function sg(i,e){const t=Ar(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function ag(i,e){i.uniform1iv(this.addr,e)}function og(i,e){i.uniform2iv(this.addr,e)}function lg(i,e){i.uniform3iv(this.addr,e)}function cg(i,e){i.uniform4iv(this.addr,e)}function ug(i,e){i.uniform1uiv(this.addr,e)}function hg(i,e){i.uniform2uiv(this.addr,e)}function dg(i,e){i.uniform3uiv(this.addr,e)}function fg(i,e){i.uniform4uiv(this.addr,e)}function pg(i,e,t){const n=this.cache,r=e.length,s=sa(t,r);bt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||cu,s[a])}function mg(i,e,t){const n=this.cache,r=e.length,s=sa(t,r);bt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||hu,s[a])}function gg(i,e,t){const n=this.cache,r=e.length,s=sa(t,r);bt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||du,s[a])}function _g(i,e,t){const n=this.cache,r=e.length,s=sa(t,r);bt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||uu,s[a])}function xg(i){switch(i){case 5126:return Qm;case 35664:return eg;case 35665:return tg;case 35666:return ng;case 35674:return ig;case 35675:return rg;case 35676:return sg;case 5124:case 35670:return ag;case 35667:case 35671:return og;case 35668:case 35672:return lg;case 35669:case 35673:return cg;case 5125:return ug;case 36294:return hg;case 36295:return dg;case 36296:return fg;case 35678:case 36198:case 36298:case 36306:case 35682:return pg;case 35679:case 36299:case 36307:return mg;case 35680:case 36300:case 36308:case 36293:return gg;case 36289:case 36303:case 36311:case 36292:return _g}}class vg{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Jm(t.type)}}class Mg{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=xg(t.type)}}class Sg{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const Wa=/(\w+)(\])?(\[|\.)?/g;function gc(i,e){i.seq.push(e),i.map[e.id]=e}function yg(i,e,t){const n=i.name,r=n.length;for(Wa.lastIndex=0;;){const s=Wa.exec(n),a=Wa.lastIndex;let o=s[1];const c=s[2]==="]",l=s[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===r){gc(t,l===void 0?new vg(o,i,e):new Mg(o,i,e));break}else{let d=t.map[o];d===void 0&&(d=new Sg(o),gc(t,d)),t=d}}}class Ws{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const s=e.getActiveUniform(t,r),a=e.getUniformLocation(t,s.name);yg(s,a,this)}}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function _c(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const Eg=37297;let Tg=0;function bg(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const xc=new Fe;function Ag(i){Ke._getMatrix(xc,Ke.workingColorSpace,i);const e=`mat3( ${xc.elements.map(t=>t.toFixed(4))} )`;switch(Ke.getTransfer(i)){case Ks:return[e,"LinearTransferOETF"];case et:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function vc(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=(i.getShaderInfoLog(e)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+bg(i.getShaderSource(e),o)}else return s}function wg(i,e){const t=Ag(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Rg(i,e){let t;switch(e){case dh:t="Linear";break;case fh:t="Reinhard";break;case ph:t="Cineon";break;case Oc:t="ACESFilmic";break;case gh:t="AgX";break;case _h:t="Neutral";break;case mh:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Bs=new L;function Cg(){Ke.getLuminanceCoefficients(Bs);const i=Bs.x.toFixed(4),e=Bs.y.toFixed(4),t=Bs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Pg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(zr).join(`
`)}function Lg(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Dg(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function zr(i){return i!==""}function Mc(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Sc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Ig=/^[ \t]*#include +<([\w\d./]+)>/gm;function Oo(i){return i.replace(Ig,Ng)}const Ug=new Map;function Ng(i,e){let t=ze[e];if(t===void 0){const n=Ug.get(e);if(n!==void 0)t=ze[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Oo(t)}const Fg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function yc(i){return i.replace(Fg,Og)}function Og(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Ec(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Bg(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Uc?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Nc?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Wn&&(e="SHADOWMAP_TYPE_VSM"),e}function zg(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case xr:case vr:e="ENVMAP_TYPE_CUBE";break;case ea:e="ENVMAP_TYPE_CUBE_UV";break}return e}function kg(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===vr&&(e="ENVMAP_MODE_REFRACTION"),e}function Vg(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Fc:e="ENVMAP_BLENDING_MULTIPLY";break;case uh:e="ENVMAP_BLENDING_MIX";break;case hh:e="ENVMAP_BLENDING_ADD";break}return e}function Hg(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Gg(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=Bg(t),l=zg(t),h=kg(t),d=Vg(t),f=Hg(t),m=Pg(t),_=Lg(s),x=r.createProgram();let p,u,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(zr).join(`
`),p.length>0&&(p+=`
`),u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(zr).join(`
`),u.length>0&&(u+=`
`)):(p=[Ec(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(zr).join(`
`),u=[Ec(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==hi?"#define TONE_MAPPING":"",t.toneMapping!==hi?ze.tonemapping_pars_fragment:"",t.toneMapping!==hi?Rg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ze.colorspace_pars_fragment,wg("linearToOutputTexel",t.outputColorSpace),Cg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(zr).join(`
`)),a=Oo(a),a=Mc(a,t),a=Sc(a,t),o=Oo(o),o=Mc(o,t),o=Sc(o,t),a=yc(a),o=yc(o),t.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,u=["#define varying in",t.glslVersion===El?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===El?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const T=E+p+a,M=E+u+o,R=_c(r,r.VERTEX_SHADER,T),A=_c(r,r.FRAGMENT_SHADER,M);r.attachShader(x,R),r.attachShader(x,A),t.index0AttributeName!==void 0?r.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x);function P(D){if(i.debug.checkShaderErrors){const O=r.getProgramInfoLog(x)||"",H=r.getShaderInfoLog(R)||"",K=r.getShaderInfoLog(A)||"",q=O.trim(),Y=H.trim(),J=K.trim();let G=!0,le=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,x,R,A);else{const de=vc(r,R,"vertex"),be=vc(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+q+`
`+de+`
`+be)}else q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",q):(Y===""||J==="")&&(le=!1);le&&(D.diagnostics={runnable:G,programLog:q,vertexShader:{log:Y,prefix:p},fragmentShader:{log:J,prefix:u}})}r.deleteShader(R),r.deleteShader(A),U=new Ws(r,x),y=Dg(r,x)}let U;this.getUniforms=function(){return U===void 0&&P(this),U};let y;this.getAttributes=function(){return y===void 0&&P(this),y};let S=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=r.getProgramParameter(x,Eg)),S},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Tg++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=R,this.fragmentShader=A,this}let Wg=0;class Xg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new qg(e),t.set(e,n)),n}}class qg{constructor(e){this.id=Wg++,this.code=e,this.usedTimes=0}}function Yg(i,e,t,n,r,s,a){const o=new Zo,c=new Xg,l=new Set,h=[],d=r.logarithmicDepthBuffer,f=r.vertexTextures;let m=r.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(y){return l.add(y),y===0?"uv":`uv${y}`}function p(y,S,D,O,H){const K=O.fog,q=H.geometry,Y=y.isMeshStandardMaterial?O.environment:null,J=(y.isMeshStandardMaterial?t:e).get(y.envMap||Y),G=J&&J.mapping===ea?J.image.height:null,le=_[y.type];y.precision!==null&&(m=r.getMaxPrecision(y.precision),m!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",m,"instead."));const de=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,be=de!==void 0?de.length:0;let He=0;q.morphAttributes.position!==void 0&&(He=1),q.morphAttributes.normal!==void 0&&(He=2),q.morphAttributes.color!==void 0&&(He=3);let ot,ht,$e,j;if(le){const Ze=Pn[le];ot=Ze.vertexShader,ht=Ze.fragmentShader}else ot=y.vertexShader,ht=y.fragmentShader,c.update(y),$e=c.getVertexShaderID(y),j=c.getFragmentShaderID(y);const Q=i.getRenderTarget(),me=i.state.buffers.depth.getReversed(),De=H.isInstancedMesh===!0,Te=H.isBatchedMesh===!0,Xe=!!y.map,Nt=!!y.matcap,C=!!J,dt=!!y.aoMap,Ue=!!y.lightMap,Pe=!!y.bumpMap,xe=!!y.normalMap,ft=!!y.displacementMap,ve=!!y.emissiveMap,Be=!!y.metalnessMap,Rt=!!y.roughnessMap,Mt=y.anisotropy>0,b=y.clearcoat>0,g=y.dispersion>0,B=y.iridescence>0,X=y.sheen>0,Z=y.transmission>0,W=Mt&&!!y.anisotropyMap,Ee=b&&!!y.clearcoatMap,re=b&&!!y.clearcoatNormalMap,Me=b&&!!y.clearcoatRoughnessMap,Se=B&&!!y.iridescenceMap,ne=B&&!!y.iridescenceThicknessMap,he=X&&!!y.sheenColorMap,Ce=X&&!!y.sheenRoughnessMap,ye=!!y.specularMap,ce=!!y.specularColorMap,Ne=!!y.specularIntensityMap,I=Z&&!!y.transmissionMap,ie=Z&&!!y.thicknessMap,se=!!y.gradientMap,pe=!!y.alphaMap,ee=y.alphaTest>0,$=!!y.alphaHash,_e=!!y.extensions;let Ie=hi;y.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Ie=i.toneMapping);const lt={shaderID:le,shaderType:y.type,shaderName:y.name,vertexShader:ot,fragmentShader:ht,defines:y.defines,customVertexShaderID:$e,customFragmentShaderID:j,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:m,batching:Te,batchingColor:Te&&H._colorsTexture!==null,instancing:De,instancingColor:De&&H.instanceColor!==null,instancingMorph:De&&H.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:Q===null?i.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Mr,alphaToCoverage:!!y.alphaToCoverage,map:Xe,matcap:Nt,envMap:C,envMapMode:C&&J.mapping,envMapCubeUVHeight:G,aoMap:dt,lightMap:Ue,bumpMap:Pe,normalMap:xe,displacementMap:f&&ft,emissiveMap:ve,normalMapObjectSpace:xe&&y.normalMapType===Sh,normalMapTangentSpace:xe&&y.normalMapType===qc,metalnessMap:Be,roughnessMap:Rt,anisotropy:Mt,anisotropyMap:W,clearcoat:b,clearcoatMap:Ee,clearcoatNormalMap:re,clearcoatRoughnessMap:Me,dispersion:g,iridescence:B,iridescenceMap:Se,iridescenceThicknessMap:ne,sheen:X,sheenColorMap:he,sheenRoughnessMap:Ce,specularMap:ye,specularColorMap:ce,specularIntensityMap:Ne,transmission:Z,transmissionMap:I,thicknessMap:ie,gradientMap:se,opaque:y.transparent===!1&&y.blending===mr&&y.alphaToCoverage===!1,alphaMap:pe,alphaTest:ee,alphaHash:$,combine:y.combine,mapUv:Xe&&x(y.map.channel),aoMapUv:dt&&x(y.aoMap.channel),lightMapUv:Ue&&x(y.lightMap.channel),bumpMapUv:Pe&&x(y.bumpMap.channel),normalMapUv:xe&&x(y.normalMap.channel),displacementMapUv:ft&&x(y.displacementMap.channel),emissiveMapUv:ve&&x(y.emissiveMap.channel),metalnessMapUv:Be&&x(y.metalnessMap.channel),roughnessMapUv:Rt&&x(y.roughnessMap.channel),anisotropyMapUv:W&&x(y.anisotropyMap.channel),clearcoatMapUv:Ee&&x(y.clearcoatMap.channel),clearcoatNormalMapUv:re&&x(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Me&&x(y.clearcoatRoughnessMap.channel),iridescenceMapUv:Se&&x(y.iridescenceMap.channel),iridescenceThicknessMapUv:ne&&x(y.iridescenceThicknessMap.channel),sheenColorMapUv:he&&x(y.sheenColorMap.channel),sheenRoughnessMapUv:Ce&&x(y.sheenRoughnessMap.channel),specularMapUv:ye&&x(y.specularMap.channel),specularColorMapUv:ce&&x(y.specularColorMap.channel),specularIntensityMapUv:Ne&&x(y.specularIntensityMap.channel),transmissionMapUv:I&&x(y.transmissionMap.channel),thicknessMapUv:ie&&x(y.thicknessMap.channel),alphaMapUv:pe&&x(y.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(xe||Mt),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!q.attributes.uv&&(Xe||pe),fog:!!K,useFog:y.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:y.flatShading===!0&&y.wireframe===!1,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:me,skinning:H.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:be,morphTextureStride:He,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ie,decodeVideoTexture:Xe&&y.map.isVideoTexture===!0&&Ke.getTransfer(y.map.colorSpace)===et,decodeVideoTextureEmissive:ve&&y.emissiveMap.isVideoTexture===!0&&Ke.getTransfer(y.emissiveMap.colorSpace)===et,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===gn,flipSided:y.side===Bt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:_e&&y.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(_e&&y.extensions.multiDraw===!0||Te)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return lt.vertexUv1s=l.has(1),lt.vertexUv2s=l.has(2),lt.vertexUv3s=l.has(3),l.clear(),lt}function u(y){const S=[];if(y.shaderID?S.push(y.shaderID):(S.push(y.customVertexShaderID),S.push(y.customFragmentShaderID)),y.defines!==void 0)for(const D in y.defines)S.push(D),S.push(y.defines[D]);return y.isRawShaderMaterial===!1&&(E(S,y),T(S,y),S.push(i.outputColorSpace)),S.push(y.customProgramCacheKey),S.join()}function E(y,S){y.push(S.precision),y.push(S.outputColorSpace),y.push(S.envMapMode),y.push(S.envMapCubeUVHeight),y.push(S.mapUv),y.push(S.alphaMapUv),y.push(S.lightMapUv),y.push(S.aoMapUv),y.push(S.bumpMapUv),y.push(S.normalMapUv),y.push(S.displacementMapUv),y.push(S.emissiveMapUv),y.push(S.metalnessMapUv),y.push(S.roughnessMapUv),y.push(S.anisotropyMapUv),y.push(S.clearcoatMapUv),y.push(S.clearcoatNormalMapUv),y.push(S.clearcoatRoughnessMapUv),y.push(S.iridescenceMapUv),y.push(S.iridescenceThicknessMapUv),y.push(S.sheenColorMapUv),y.push(S.sheenRoughnessMapUv),y.push(S.specularMapUv),y.push(S.specularColorMapUv),y.push(S.specularIntensityMapUv),y.push(S.transmissionMapUv),y.push(S.thicknessMapUv),y.push(S.combine),y.push(S.fogExp2),y.push(S.sizeAttenuation),y.push(S.morphTargetsCount),y.push(S.morphAttributeCount),y.push(S.numDirLights),y.push(S.numPointLights),y.push(S.numSpotLights),y.push(S.numSpotLightMaps),y.push(S.numHemiLights),y.push(S.numRectAreaLights),y.push(S.numDirLightShadows),y.push(S.numPointLightShadows),y.push(S.numSpotLightShadows),y.push(S.numSpotLightShadowsWithMaps),y.push(S.numLightProbes),y.push(S.shadowMapType),y.push(S.toneMapping),y.push(S.numClippingPlanes),y.push(S.numClipIntersection),y.push(S.depthPacking)}function T(y,S){o.disableAll(),S.supportsVertexTextures&&o.enable(0),S.instancing&&o.enable(1),S.instancingColor&&o.enable(2),S.instancingMorph&&o.enable(3),S.matcap&&o.enable(4),S.envMap&&o.enable(5),S.normalMapObjectSpace&&o.enable(6),S.normalMapTangentSpace&&o.enable(7),S.clearcoat&&o.enable(8),S.iridescence&&o.enable(9),S.alphaTest&&o.enable(10),S.vertexColors&&o.enable(11),S.vertexAlphas&&o.enable(12),S.vertexUv1s&&o.enable(13),S.vertexUv2s&&o.enable(14),S.vertexUv3s&&o.enable(15),S.vertexTangents&&o.enable(16),S.anisotropy&&o.enable(17),S.alphaHash&&o.enable(18),S.batching&&o.enable(19),S.dispersion&&o.enable(20),S.batchingColor&&o.enable(21),S.gradientMap&&o.enable(22),y.push(o.mask),o.disableAll(),S.fog&&o.enable(0),S.useFog&&o.enable(1),S.flatShading&&o.enable(2),S.logarithmicDepthBuffer&&o.enable(3),S.reversedDepthBuffer&&o.enable(4),S.skinning&&o.enable(5),S.morphTargets&&o.enable(6),S.morphNormals&&o.enable(7),S.morphColors&&o.enable(8),S.premultipliedAlpha&&o.enable(9),S.shadowMapEnabled&&o.enable(10),S.doubleSided&&o.enable(11),S.flipSided&&o.enable(12),S.useDepthPacking&&o.enable(13),S.dithering&&o.enable(14),S.transmission&&o.enable(15),S.sheen&&o.enable(16),S.opaque&&o.enable(17),S.pointsUvs&&o.enable(18),S.decodeVideoTexture&&o.enable(19),S.decodeVideoTextureEmissive&&o.enable(20),S.alphaToCoverage&&o.enable(21),y.push(o.mask)}function M(y){const S=_[y.type];let D;if(S){const O=Pn[S];D=hd.clone(O.uniforms)}else D=y.uniforms;return D}function R(y,S){let D;for(let O=0,H=h.length;O<H;O++){const K=h[O];if(K.cacheKey===S){D=K,++D.usedTimes;break}}return D===void 0&&(D=new Gg(i,S,y,s),h.push(D)),D}function A(y){if(--y.usedTimes===0){const S=h.indexOf(y);h[S]=h[h.length-1],h.pop(),y.destroy()}}function P(y){c.remove(y)}function U(){c.dispose()}return{getParameters:p,getProgramCacheKey:u,getUniforms:M,acquireProgram:R,releaseProgram:A,releaseShaderCache:P,programs:h,dispose:U}}function Kg(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,c){i.get(a)[o]=c}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function jg(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Tc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function bc(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(d,f,m,_,x,p){let u=i[e];return u===void 0?(u={id:d.id,object:d,geometry:f,material:m,groupOrder:_,renderOrder:d.renderOrder,z:x,group:p},i[e]=u):(u.id=d.id,u.object=d,u.geometry=f,u.material=m,u.groupOrder=_,u.renderOrder=d.renderOrder,u.z=x,u.group=p),e++,u}function o(d,f,m,_,x,p){const u=a(d,f,m,_,x,p);m.transmission>0?n.push(u):m.transparent===!0?r.push(u):t.push(u)}function c(d,f,m,_,x,p){const u=a(d,f,m,_,x,p);m.transmission>0?n.unshift(u):m.transparent===!0?r.unshift(u):t.unshift(u)}function l(d,f){t.length>1&&t.sort(d||jg),n.length>1&&n.sort(f||Tc),r.length>1&&r.sort(f||Tc)}function h(){for(let d=e,f=i.length;d<f;d++){const m=i[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:o,unshift:c,finish:h,sort:l}}function $g(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new bc,i.set(n,[a])):r>=s.length?(a=new bc,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Zg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Ve};break;case"SpotLight":t={position:new L,direction:new L,color:new Ve,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Ve,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Ve,groundColor:new Ve};break;case"RectAreaLight":t={color:new Ve,position:new L,halfWidth:new L,halfHeight:new L};break}return i[e.id]=t,t}}}function Jg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Qg=0;function e0(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function t0(i){const e=new Zg,t=Jg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new L);const r=new L,s=new rt,a=new rt;function o(l){let h=0,d=0,f=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let m=0,_=0,x=0,p=0,u=0,E=0,T=0,M=0,R=0,A=0,P=0;l.sort(e0);for(let y=0,S=l.length;y<S;y++){const D=l[y],O=D.color,H=D.intensity,K=D.distance,q=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)h+=O.r*H,d+=O.g*H,f+=O.b*H;else if(D.isLightProbe){for(let Y=0;Y<9;Y++)n.probe[Y].addScaledVector(D.sh.coefficients[Y],H);P++}else if(D.isDirectionalLight){const Y=e.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const J=D.shadow,G=t.get(D);G.shadowIntensity=J.intensity,G.shadowBias=J.bias,G.shadowNormalBias=J.normalBias,G.shadowRadius=J.radius,G.shadowMapSize=J.mapSize,n.directionalShadow[m]=G,n.directionalShadowMap[m]=q,n.directionalShadowMatrix[m]=D.shadow.matrix,E++}n.directional[m]=Y,m++}else if(D.isSpotLight){const Y=e.get(D);Y.position.setFromMatrixPosition(D.matrixWorld),Y.color.copy(O).multiplyScalar(H),Y.distance=K,Y.coneCos=Math.cos(D.angle),Y.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),Y.decay=D.decay,n.spot[x]=Y;const J=D.shadow;if(D.map&&(n.spotLightMap[R]=D.map,R++,J.updateMatrices(D),D.castShadow&&A++),n.spotLightMatrix[x]=J.matrix,D.castShadow){const G=t.get(D);G.shadowIntensity=J.intensity,G.shadowBias=J.bias,G.shadowNormalBias=J.normalBias,G.shadowRadius=J.radius,G.shadowMapSize=J.mapSize,n.spotShadow[x]=G,n.spotShadowMap[x]=q,M++}x++}else if(D.isRectAreaLight){const Y=e.get(D);Y.color.copy(O).multiplyScalar(H),Y.halfWidth.set(D.width*.5,0,0),Y.halfHeight.set(0,D.height*.5,0),n.rectArea[p]=Y,p++}else if(D.isPointLight){const Y=e.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),Y.distance=D.distance,Y.decay=D.decay,D.castShadow){const J=D.shadow,G=t.get(D);G.shadowIntensity=J.intensity,G.shadowBias=J.bias,G.shadowNormalBias=J.normalBias,G.shadowRadius=J.radius,G.shadowMapSize=J.mapSize,G.shadowCameraNear=J.camera.near,G.shadowCameraFar=J.camera.far,n.pointShadow[_]=G,n.pointShadowMap[_]=q,n.pointShadowMatrix[_]=D.shadow.matrix,T++}n.point[_]=Y,_++}else if(D.isHemisphereLight){const Y=e.get(D);Y.skyColor.copy(D.color).multiplyScalar(H),Y.groundColor.copy(D.groundColor).multiplyScalar(H),n.hemi[u]=Y,u++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=oe.LTC_FLOAT_1,n.rectAreaLTC2=oe.LTC_FLOAT_2):(n.rectAreaLTC1=oe.LTC_HALF_1,n.rectAreaLTC2=oe.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=f;const U=n.hash;(U.directionalLength!==m||U.pointLength!==_||U.spotLength!==x||U.rectAreaLength!==p||U.hemiLength!==u||U.numDirectionalShadows!==E||U.numPointShadows!==T||U.numSpotShadows!==M||U.numSpotMaps!==R||U.numLightProbes!==P)&&(n.directional.length=m,n.spot.length=x,n.rectArea.length=p,n.point.length=_,n.hemi.length=u,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.pointShadow.length=T,n.pointShadowMap.length=T,n.spotShadow.length=M,n.spotShadowMap.length=M,n.directionalShadowMatrix.length=E,n.pointShadowMatrix.length=T,n.spotLightMatrix.length=M+R-A,n.spotLightMap.length=R,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=P,U.directionalLength=m,U.pointLength=_,U.spotLength=x,U.rectAreaLength=p,U.hemiLength=u,U.numDirectionalShadows=E,U.numPointShadows=T,U.numSpotShadows=M,U.numSpotMaps=R,U.numLightProbes=P,n.version=Qg++)}function c(l,h){let d=0,f=0,m=0,_=0,x=0;const p=h.matrixWorldInverse;for(let u=0,E=l.length;u<E;u++){const T=l[u];if(T.isDirectionalLight){const M=n.directional[d];M.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),d++}else if(T.isSpotLight){const M=n.spot[m];M.position.setFromMatrixPosition(T.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),m++}else if(T.isRectAreaLight){const M=n.rectArea[_];M.position.setFromMatrixPosition(T.matrixWorld),M.position.applyMatrix4(p),a.identity(),s.copy(T.matrixWorld),s.premultiply(p),a.extractRotation(s),M.halfWidth.set(T.width*.5,0,0),M.halfHeight.set(0,T.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),_++}else if(T.isPointLight){const M=n.point[f];M.position.setFromMatrixPosition(T.matrixWorld),M.position.applyMatrix4(p),f++}else if(T.isHemisphereLight){const M=n.hemi[x];M.direction.setFromMatrixPosition(T.matrixWorld),M.direction.transformDirection(p),x++}}}return{setup:o,setupView:c,state:n}}function Ac(i){const e=new t0(i),t=[],n=[];function r(h){l.camera=h,t.length=0,n.length=0}function s(h){t.push(h)}function a(h){n.push(h)}function o(){e.setup(t)}function c(h){e.setupView(t,h)}const l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:l,setupLights:o,setupLightsView:c,pushLight:s,pushShadow:a}}function n0(i){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Ac(i),e.set(r,[o])):s>=a.length?(o=new Ac(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const i0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,r0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function s0(i,e,t){let n=new Qo;const r=new Oe,s=new Oe,a=new nt,o=new bd({depthPacking:Mh}),c=new Ad,l={},h=t.maxTextureSize,d={[pi]:Bt,[Bt]:pi,[gn]:gn},f=new On({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Oe},radius:{value:4}},vertexShader:i0,fragmentShader:r0}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const _=new wt;_.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new Et(_,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Uc;let u=this.type;this.render=function(A,P,U){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;const y=i.getRenderTarget(),S=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),O=i.state;O.setBlending(ui),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const H=u!==Wn&&this.type===Wn,K=u===Wn&&this.type!==Wn;for(let q=0,Y=A.length;q<Y;q++){const J=A[q],G=J.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;r.copy(G.mapSize);const le=G.getFrameExtents();if(r.multiply(le),s.copy(G.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/le.x),r.x=s.x*le.x,G.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/le.y),r.y=s.y*le.y,G.mapSize.y=s.y)),G.map===null||H===!0||K===!0){const be=this.type!==Wn?{minFilter:cn,magFilter:cn}:{};G.map!==null&&G.map.dispose(),G.map=new mi(r.x,r.y,be),G.map.texture.name=J.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();const de=G.getViewportCount();for(let be=0;be<de;be++){const He=G.getViewport(be);a.set(s.x*He.x,s.y*He.y,s.x*He.z,s.y*He.w),O.viewport(a),G.updateMatrices(J,be),n=G.getFrustum(),M(P,U,G.camera,J,this.type)}G.isPointLightShadow!==!0&&this.type===Wn&&E(G,U),G.needsUpdate=!1}u=this.type,p.needsUpdate=!1,i.setRenderTarget(y,S,D)};function E(A,P){const U=e.update(x);f.defines.VSM_SAMPLES!==A.blurSamples&&(f.defines.VSM_SAMPLES=A.blurSamples,m.defines.VSM_SAMPLES=A.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new mi(r.x,r.y)),f.uniforms.shadow_pass.value=A.map.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(P,null,U,f,x,null),m.uniforms.shadow_pass.value=A.mapPass.texture,m.uniforms.resolution.value=A.mapSize,m.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(P,null,U,m,x,null)}function T(A,P,U,y){let S=null;const D=U.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(D!==void 0)S=D;else if(S=U.isPointLight===!0?c:o,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const O=S.uuid,H=P.uuid;let K=l[O];K===void 0&&(K={},l[O]=K);let q=K[H];q===void 0&&(q=S.clone(),K[H]=q,P.addEventListener("dispose",R)),S=q}if(S.visible=P.visible,S.wireframe=P.wireframe,y===Wn?S.side=P.shadowSide!==null?P.shadowSide:P.side:S.side=P.shadowSide!==null?P.shadowSide:d[P.side],S.alphaMap=P.alphaMap,S.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,S.map=P.map,S.clipShadows=P.clipShadows,S.clippingPlanes=P.clippingPlanes,S.clipIntersection=P.clipIntersection,S.displacementMap=P.displacementMap,S.displacementScale=P.displacementScale,S.displacementBias=P.displacementBias,S.wireframeLinewidth=P.wireframeLinewidth,S.linewidth=P.linewidth,U.isPointLight===!0&&S.isMeshDistanceMaterial===!0){const O=i.properties.get(S);O.light=U}return S}function M(A,P,U,y,S){if(A.visible===!1)return;if(A.layers.test(P.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&S===Wn)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(U.matrixWorldInverse,A.matrixWorld);const H=e.update(A),K=A.material;if(Array.isArray(K)){const q=H.groups;for(let Y=0,J=q.length;Y<J;Y++){const G=q[Y],le=K[G.materialIndex];if(le&&le.visible){const de=T(A,le,y,S);A.onBeforeShadow(i,A,P,U,H,de,G),i.renderBufferDirect(U,null,H,de,A,G),A.onAfterShadow(i,A,P,U,H,de,G)}}}else if(K.visible){const q=T(A,K,y,S);A.onBeforeShadow(i,A,P,U,H,q,null),i.renderBufferDirect(U,null,H,q,A,null),A.onAfterShadow(i,A,P,U,H,q,null)}}const O=A.children;for(let H=0,K=O.length;H<K;H++)M(O[H],P,U,y,S)}function R(A){A.target.removeEventListener("dispose",R);for(const U in l){const y=l[U],S=A.target.uuid;S in y&&(y[S].dispose(),delete y[S])}}}const a0={[ja]:$a,[Za]:eo,[Ja]:to,[_r]:Qa,[$a]:ja,[eo]:Za,[to]:Ja,[Qa]:_r};function o0(i,e){function t(){let I=!1;const ie=new nt;let se=null;const pe=new nt(0,0,0,0);return{setMask:function(ee){se!==ee&&!I&&(i.colorMask(ee,ee,ee,ee),se=ee)},setLocked:function(ee){I=ee},setClear:function(ee,$,_e,Ie,lt){lt===!0&&(ee*=Ie,$*=Ie,_e*=Ie),ie.set(ee,$,_e,Ie),pe.equals(ie)===!1&&(i.clearColor(ee,$,_e,Ie),pe.copy(ie))},reset:function(){I=!1,se=null,pe.set(-1,0,0,0)}}}function n(){let I=!1,ie=!1,se=null,pe=null,ee=null;return{setReversed:function($){if(ie!==$){const _e=e.get("EXT_clip_control");$?_e.clipControlEXT(_e.LOWER_LEFT_EXT,_e.ZERO_TO_ONE_EXT):_e.clipControlEXT(_e.LOWER_LEFT_EXT,_e.NEGATIVE_ONE_TO_ONE_EXT),ie=$;const Ie=ee;ee=null,this.setClear(Ie)}},getReversed:function(){return ie},setTest:function($){$?Q(i.DEPTH_TEST):me(i.DEPTH_TEST)},setMask:function($){se!==$&&!I&&(i.depthMask($),se=$)},setFunc:function($){if(ie&&($=a0[$]),pe!==$){switch($){case ja:i.depthFunc(i.NEVER);break;case $a:i.depthFunc(i.ALWAYS);break;case Za:i.depthFunc(i.LESS);break;case _r:i.depthFunc(i.LEQUAL);break;case Ja:i.depthFunc(i.EQUAL);break;case Qa:i.depthFunc(i.GEQUAL);break;case eo:i.depthFunc(i.GREATER);break;case to:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}pe=$}},setLocked:function($){I=$},setClear:function($){ee!==$&&(ie&&($=1-$),i.clearDepth($),ee=$)},reset:function(){I=!1,se=null,pe=null,ee=null,ie=!1}}}function r(){let I=!1,ie=null,se=null,pe=null,ee=null,$=null,_e=null,Ie=null,lt=null;return{setTest:function(Ze){I||(Ze?Q(i.STENCIL_TEST):me(i.STENCIL_TEST))},setMask:function(Ze){ie!==Ze&&!I&&(i.stencilMask(Ze),ie=Ze)},setFunc:function(Ze,Bn,Rn){(se!==Ze||pe!==Bn||ee!==Rn)&&(i.stencilFunc(Ze,Bn,Rn),se=Ze,pe=Bn,ee=Rn)},setOp:function(Ze,Bn,Rn){($!==Ze||_e!==Bn||Ie!==Rn)&&(i.stencilOp(Ze,Bn,Rn),$=Ze,_e=Bn,Ie=Rn)},setLocked:function(Ze){I=Ze},setClear:function(Ze){lt!==Ze&&(i.clearStencil(Ze),lt=Ze)},reset:function(){I=!1,ie=null,se=null,pe=null,ee=null,$=null,_e=null,Ie=null,lt=null}}}const s=new t,a=new n,o=new r,c=new WeakMap,l=new WeakMap;let h={},d={},f=new WeakMap,m=[],_=null,x=!1,p=null,u=null,E=null,T=null,M=null,R=null,A=null,P=new Ve(0,0,0),U=0,y=!1,S=null,D=null,O=null,H=null,K=null;const q=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Y=!1,J=0;const G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(G)[1]),Y=J>=1):G.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),Y=J>=2);let le=null,de={};const be=i.getParameter(i.SCISSOR_BOX),He=i.getParameter(i.VIEWPORT),ot=new nt().fromArray(be),ht=new nt().fromArray(He);function $e(I,ie,se,pe){const ee=new Uint8Array(4),$=i.createTexture();i.bindTexture(I,$),i.texParameteri(I,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(I,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let _e=0;_e<se;_e++)I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY?i.texImage3D(ie,0,i.RGBA,1,1,pe,0,i.RGBA,i.UNSIGNED_BYTE,ee):i.texImage2D(ie+_e,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ee);return $}const j={};j[i.TEXTURE_2D]=$e(i.TEXTURE_2D,i.TEXTURE_2D,1),j[i.TEXTURE_CUBE_MAP]=$e(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[i.TEXTURE_2D_ARRAY]=$e(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),j[i.TEXTURE_3D]=$e(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Q(i.DEPTH_TEST),a.setFunc(_r),Pe(!1),xe(_l),Q(i.CULL_FACE),dt(ui);function Q(I){h[I]!==!0&&(i.enable(I),h[I]=!0)}function me(I){h[I]!==!1&&(i.disable(I),h[I]=!1)}function De(I,ie){return d[I]!==ie?(i.bindFramebuffer(I,ie),d[I]=ie,I===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=ie),I===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=ie),!0):!1}function Te(I,ie){let se=m,pe=!1;if(I){se=f.get(ie),se===void 0&&(se=[],f.set(ie,se));const ee=I.textures;if(se.length!==ee.length||se[0]!==i.COLOR_ATTACHMENT0){for(let $=0,_e=ee.length;$<_e;$++)se[$]=i.COLOR_ATTACHMENT0+$;se.length=ee.length,pe=!0}}else se[0]!==i.BACK&&(se[0]=i.BACK,pe=!0);pe&&i.drawBuffers(se)}function Xe(I){return _!==I?(i.useProgram(I),_=I,!0):!1}const Nt={[Pi]:i.FUNC_ADD,[Yu]:i.FUNC_SUBTRACT,[Ku]:i.FUNC_REVERSE_SUBTRACT};Nt[ju]=i.MIN,Nt[$u]=i.MAX;const C={[Zu]:i.ZERO,[Ju]:i.ONE,[Qu]:i.SRC_COLOR,[Ya]:i.SRC_ALPHA,[sh]:i.SRC_ALPHA_SATURATE,[ih]:i.DST_COLOR,[th]:i.DST_ALPHA,[eh]:i.ONE_MINUS_SRC_COLOR,[Ka]:i.ONE_MINUS_SRC_ALPHA,[rh]:i.ONE_MINUS_DST_COLOR,[nh]:i.ONE_MINUS_DST_ALPHA,[ah]:i.CONSTANT_COLOR,[oh]:i.ONE_MINUS_CONSTANT_COLOR,[lh]:i.CONSTANT_ALPHA,[ch]:i.ONE_MINUS_CONSTANT_ALPHA};function dt(I,ie,se,pe,ee,$,_e,Ie,lt,Ze){if(I===ui){x===!0&&(me(i.BLEND),x=!1);return}if(x===!1&&(Q(i.BLEND),x=!0),I!==qu){if(I!==p||Ze!==y){if((u!==Pi||M!==Pi)&&(i.blendEquation(i.FUNC_ADD),u=Pi,M=Pi),Ze)switch(I){case mr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case xl:i.blendFunc(i.ONE,i.ONE);break;case vl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ml:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case mr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case xl:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case vl:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ml:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}E=null,T=null,R=null,A=null,P.set(0,0,0),U=0,p=I,y=Ze}return}ee=ee||ie,$=$||se,_e=_e||pe,(ie!==u||ee!==M)&&(i.blendEquationSeparate(Nt[ie],Nt[ee]),u=ie,M=ee),(se!==E||pe!==T||$!==R||_e!==A)&&(i.blendFuncSeparate(C[se],C[pe],C[$],C[_e]),E=se,T=pe,R=$,A=_e),(Ie.equals(P)===!1||lt!==U)&&(i.blendColor(Ie.r,Ie.g,Ie.b,lt),P.copy(Ie),U=lt),p=I,y=!1}function Ue(I,ie){I.side===gn?me(i.CULL_FACE):Q(i.CULL_FACE);let se=I.side===Bt;ie&&(se=!se),Pe(se),I.blending===mr&&I.transparent===!1?dt(ui):dt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),a.setFunc(I.depthFunc),a.setTest(I.depthTest),a.setMask(I.depthWrite),s.setMask(I.colorWrite);const pe=I.stencilWrite;o.setTest(pe),pe&&(o.setMask(I.stencilWriteMask),o.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),o.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),ve(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?Q(i.SAMPLE_ALPHA_TO_COVERAGE):me(i.SAMPLE_ALPHA_TO_COVERAGE)}function Pe(I){S!==I&&(I?i.frontFace(i.CW):i.frontFace(i.CCW),S=I)}function xe(I){I!==Wu?(Q(i.CULL_FACE),I!==D&&(I===_l?i.cullFace(i.BACK):I===Xu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):me(i.CULL_FACE),D=I}function ft(I){I!==O&&(Y&&i.lineWidth(I),O=I)}function ve(I,ie,se){I?(Q(i.POLYGON_OFFSET_FILL),(H!==ie||K!==se)&&(i.polygonOffset(ie,se),H=ie,K=se)):me(i.POLYGON_OFFSET_FILL)}function Be(I){I?Q(i.SCISSOR_TEST):me(i.SCISSOR_TEST)}function Rt(I){I===void 0&&(I=i.TEXTURE0+q-1),le!==I&&(i.activeTexture(I),le=I)}function Mt(I,ie,se){se===void 0&&(le===null?se=i.TEXTURE0+q-1:se=le);let pe=de[se];pe===void 0&&(pe={type:void 0,texture:void 0},de[se]=pe),(pe.type!==I||pe.texture!==ie)&&(le!==se&&(i.activeTexture(se),le=se),i.bindTexture(I,ie||j[I]),pe.type=I,pe.texture=ie)}function b(){const I=de[le];I!==void 0&&I.type!==void 0&&(i.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function g(){try{i.compressedTexImage2D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function B(){try{i.compressedTexImage3D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function X(){try{i.texSubImage2D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Z(){try{i.texSubImage3D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function W(){try{i.compressedTexSubImage2D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ee(){try{i.compressedTexSubImage3D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function re(){try{i.texStorage2D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Me(){try{i.texStorage3D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Se(){try{i.texImage2D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ne(){try{i.texImage3D(...arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function he(I){ot.equals(I)===!1&&(i.scissor(I.x,I.y,I.z,I.w),ot.copy(I))}function Ce(I){ht.equals(I)===!1&&(i.viewport(I.x,I.y,I.z,I.w),ht.copy(I))}function ye(I,ie){let se=l.get(ie);se===void 0&&(se=new WeakMap,l.set(ie,se));let pe=se.get(I);pe===void 0&&(pe=i.getUniformBlockIndex(ie,I.name),se.set(I,pe))}function ce(I,ie){const pe=l.get(ie).get(I);c.get(ie)!==pe&&(i.uniformBlockBinding(ie,pe,I.__bindingPointIndex),c.set(ie,pe))}function Ne(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},le=null,de={},d={},f=new WeakMap,m=[],_=null,x=!1,p=null,u=null,E=null,T=null,M=null,R=null,A=null,P=new Ve(0,0,0),U=0,y=!1,S=null,D=null,O=null,H=null,K=null,ot.set(0,0,i.canvas.width,i.canvas.height),ht.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:Q,disable:me,bindFramebuffer:De,drawBuffers:Te,useProgram:Xe,setBlending:dt,setMaterial:Ue,setFlipSided:Pe,setCullFace:xe,setLineWidth:ft,setPolygonOffset:ve,setScissorTest:Be,activeTexture:Rt,bindTexture:Mt,unbindTexture:b,compressedTexImage2D:g,compressedTexImage3D:B,texImage2D:Se,texImage3D:ne,updateUBOMapping:ye,uniformBlockBinding:ce,texStorage2D:re,texStorage3D:Me,texSubImage2D:X,texSubImage3D:Z,compressedTexSubImage2D:W,compressedTexSubImage3D:Ee,scissor:he,viewport:Ce,reset:Ne}}function l0(i,e,t,n,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Oe,h=new WeakMap;let d;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(b,g){return m?new OffscreenCanvas(b,g):$s("canvas")}function x(b,g,B){let X=1;const Z=Mt(b);if((Z.width>B||Z.height>B)&&(X=B/Math.max(Z.width,Z.height)),X<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){const W=Math.floor(X*Z.width),Ee=Math.floor(X*Z.height);d===void 0&&(d=_(W,Ee));const re=g?_(W,Ee):d;return re.width=W,re.height=Ee,re.getContext("2d").drawImage(b,0,0,W,Ee),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+W+"x"+Ee+")."),re}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),b;return b}function p(b){return b.generateMipmaps}function u(b){i.generateMipmap(b)}function E(b){return b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?i.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function T(b,g,B,X,Z=!1){if(b!==null){if(i[b]!==void 0)return i[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let W=g;if(g===i.RED&&(B===i.FLOAT&&(W=i.R32F),B===i.HALF_FLOAT&&(W=i.R16F),B===i.UNSIGNED_BYTE&&(W=i.R8)),g===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(W=i.R8UI),B===i.UNSIGNED_SHORT&&(W=i.R16UI),B===i.UNSIGNED_INT&&(W=i.R32UI),B===i.BYTE&&(W=i.R8I),B===i.SHORT&&(W=i.R16I),B===i.INT&&(W=i.R32I)),g===i.RG&&(B===i.FLOAT&&(W=i.RG32F),B===i.HALF_FLOAT&&(W=i.RG16F),B===i.UNSIGNED_BYTE&&(W=i.RG8)),g===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(W=i.RG8UI),B===i.UNSIGNED_SHORT&&(W=i.RG16UI),B===i.UNSIGNED_INT&&(W=i.RG32UI),B===i.BYTE&&(W=i.RG8I),B===i.SHORT&&(W=i.RG16I),B===i.INT&&(W=i.RG32I)),g===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(W=i.RGB8UI),B===i.UNSIGNED_SHORT&&(W=i.RGB16UI),B===i.UNSIGNED_INT&&(W=i.RGB32UI),B===i.BYTE&&(W=i.RGB8I),B===i.SHORT&&(W=i.RGB16I),B===i.INT&&(W=i.RGB32I)),g===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(W=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(W=i.RGBA16UI),B===i.UNSIGNED_INT&&(W=i.RGBA32UI),B===i.BYTE&&(W=i.RGBA8I),B===i.SHORT&&(W=i.RGBA16I),B===i.INT&&(W=i.RGBA32I)),g===i.RGB&&(B===i.UNSIGNED_INT_5_9_9_9_REV&&(W=i.RGB9_E5),B===i.UNSIGNED_INT_10F_11F_11F_REV&&(W=i.R11F_G11F_B10F)),g===i.RGBA){const Ee=Z?Ks:Ke.getTransfer(X);B===i.FLOAT&&(W=i.RGBA32F),B===i.HALF_FLOAT&&(W=i.RGBA16F),B===i.UNSIGNED_BYTE&&(W=Ee===et?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT_4_4_4_4&&(W=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(W=i.RGB5_A1)}return(W===i.R16F||W===i.R32F||W===i.RG16F||W===i.RG32F||W===i.RGBA16F||W===i.RGBA32F)&&e.get("EXT_color_buffer_float"),W}function M(b,g){let B;return b?g===null||g===Fi||g===Kr?B=i.DEPTH24_STENCIL8:g===Un?B=i.DEPTH32F_STENCIL8:g===Yr&&(B=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===Fi||g===Kr?B=i.DEPTH_COMPONENT24:g===Un?B=i.DEPTH_COMPONENT32F:g===Yr&&(B=i.DEPTH_COMPONENT16),B}function R(b,g){return p(b)===!0||b.isFramebufferTexture&&b.minFilter!==cn&&b.minFilter!==In?Math.log2(Math.max(g.width,g.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?g.mipmaps.length:1}function A(b){const g=b.target;g.removeEventListener("dispose",A),U(g),g.isVideoTexture&&h.delete(g)}function P(b){const g=b.target;g.removeEventListener("dispose",P),S(g)}function U(b){const g=n.get(b);if(g.__webglInit===void 0)return;const B=b.source,X=f.get(B);if(X){const Z=X[g.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&y(b),Object.keys(X).length===0&&f.delete(B)}n.remove(b)}function y(b){const g=n.get(b);i.deleteTexture(g.__webglTexture);const B=b.source,X=f.get(B);delete X[g.__cacheKey],a.memory.textures--}function S(b){const g=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(g.__webglFramebuffer[X]))for(let Z=0;Z<g.__webglFramebuffer[X].length;Z++)i.deleteFramebuffer(g.__webglFramebuffer[X][Z]);else i.deleteFramebuffer(g.__webglFramebuffer[X]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[X])}else{if(Array.isArray(g.__webglFramebuffer))for(let X=0;X<g.__webglFramebuffer.length;X++)i.deleteFramebuffer(g.__webglFramebuffer[X]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let X=0;X<g.__webglColorRenderbuffer.length;X++)g.__webglColorRenderbuffer[X]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[X]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const B=b.textures;for(let X=0,Z=B.length;X<Z;X++){const W=n.get(B[X]);W.__webglTexture&&(i.deleteTexture(W.__webglTexture),a.memory.textures--),n.remove(B[X])}n.remove(b)}let D=0;function O(){D=0}function H(){const b=D;return b>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+r.maxTextures),D+=1,b}function K(b){const g=[];return g.push(b.wrapS),g.push(b.wrapT),g.push(b.wrapR||0),g.push(b.magFilter),g.push(b.minFilter),g.push(b.anisotropy),g.push(b.internalFormat),g.push(b.format),g.push(b.type),g.push(b.generateMipmaps),g.push(b.premultiplyAlpha),g.push(b.flipY),g.push(b.unpackAlignment),g.push(b.colorSpace),g.join()}function q(b,g){const B=n.get(b);if(b.isVideoTexture&&Be(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&B.__version!==b.version){const X=b.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{j(B,b,g);return}}else b.isExternalTexture&&(B.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+g)}function Y(b,g){const B=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&B.__version!==b.version){j(B,b,g);return}t.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+g)}function J(b,g){const B=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&B.__version!==b.version){j(B,b,g);return}t.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+g)}function G(b,g){const B=n.get(b);if(b.version>0&&B.__version!==b.version){Q(B,b,g);return}t.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+g)}const le={[ro]:i.REPEAT,[Di]:i.CLAMP_TO_EDGE,[so]:i.MIRRORED_REPEAT},de={[cn]:i.NEAREST,[xh]:i.NEAREST_MIPMAP_NEAREST,[fs]:i.NEAREST_MIPMAP_LINEAR,[In]:i.LINEAR,[fa]:i.LINEAR_MIPMAP_NEAREST,[Ii]:i.LINEAR_MIPMAP_LINEAR},be={[yh]:i.NEVER,[Rh]:i.ALWAYS,[Eh]:i.LESS,[Yc]:i.LEQUAL,[Th]:i.EQUAL,[wh]:i.GEQUAL,[bh]:i.GREATER,[Ah]:i.NOTEQUAL};function He(b,g){if(g.type===Un&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===In||g.magFilter===fa||g.magFilter===fs||g.magFilter===Ii||g.minFilter===In||g.minFilter===fa||g.minFilter===fs||g.minFilter===Ii)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,le[g.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,le[g.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,le[g.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,de[g.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,de[g.minFilter]),g.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,be[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===cn||g.minFilter!==fs&&g.minFilter!==Ii||g.type===Un&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){const B=e.get("EXT_texture_filter_anisotropic");i.texParameterf(b,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function ot(b,g){let B=!1;b.__webglInit===void 0&&(b.__webglInit=!0,g.addEventListener("dispose",A));const X=g.source;let Z=f.get(X);Z===void 0&&(Z={},f.set(X,Z));const W=K(g);if(W!==b.__cacheKey){Z[W]===void 0&&(Z[W]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,B=!0),Z[W].usedTimes++;const Ee=Z[b.__cacheKey];Ee!==void 0&&(Z[b.__cacheKey].usedTimes--,Ee.usedTimes===0&&y(g)),b.__cacheKey=W,b.__webglTexture=Z[W].texture}return B}function ht(b,g,B){return Math.floor(Math.floor(b/B)/g)}function $e(b,g,B,X){const W=b.updateRanges;if(W.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,B,X,g.data);else{W.sort((ne,he)=>ne.start-he.start);let Ee=0;for(let ne=1;ne<W.length;ne++){const he=W[Ee],Ce=W[ne],ye=he.start+he.count,ce=ht(Ce.start,g.width,4),Ne=ht(he.start,g.width,4);Ce.start<=ye+1&&ce===Ne&&ht(Ce.start+Ce.count-1,g.width,4)===ce?he.count=Math.max(he.count,Ce.start+Ce.count-he.start):(++Ee,W[Ee]=Ce)}W.length=Ee+1;const re=i.getParameter(i.UNPACK_ROW_LENGTH),Me=i.getParameter(i.UNPACK_SKIP_PIXELS),Se=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let ne=0,he=W.length;ne<he;ne++){const Ce=W[ne],ye=Math.floor(Ce.start/4),ce=Math.ceil(Ce.count/4),Ne=ye%g.width,I=Math.floor(ye/g.width),ie=ce,se=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,Ne),i.pixelStorei(i.UNPACK_SKIP_ROWS,I),t.texSubImage2D(i.TEXTURE_2D,0,Ne,I,ie,se,B,X,g.data)}b.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,re),i.pixelStorei(i.UNPACK_SKIP_PIXELS,Me),i.pixelStorei(i.UNPACK_SKIP_ROWS,Se)}}function j(b,g,B){let X=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(X=i.TEXTURE_3D);const Z=ot(b,g),W=g.source;t.bindTexture(X,b.__webglTexture,i.TEXTURE0+B);const Ee=n.get(W);if(W.version!==Ee.__version||Z===!0){t.activeTexture(i.TEXTURE0+B);const re=Ke.getPrimaries(Ke.workingColorSpace),Me=g.colorSpace===oi?null:Ke.getPrimaries(g.colorSpace),Se=g.colorSpace===oi||re===Me?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se);let ne=x(g.image,!1,r.maxTextureSize);ne=Rt(g,ne);const he=s.convert(g.format,g.colorSpace),Ce=s.convert(g.type);let ye=T(g.internalFormat,he,Ce,g.colorSpace,g.isVideoTexture);He(X,g);let ce;const Ne=g.mipmaps,I=g.isVideoTexture!==!0,ie=Ee.__version===void 0||Z===!0,se=W.dataReady,pe=R(g,ne);if(g.isDepthTexture)ye=M(g.format===$r,g.type),ie&&(I?t.texStorage2D(i.TEXTURE_2D,1,ye,ne.width,ne.height):t.texImage2D(i.TEXTURE_2D,0,ye,ne.width,ne.height,0,he,Ce,null));else if(g.isDataTexture)if(Ne.length>0){I&&ie&&t.texStorage2D(i.TEXTURE_2D,pe,ye,Ne[0].width,Ne[0].height);for(let ee=0,$=Ne.length;ee<$;ee++)ce=Ne[ee],I?se&&t.texSubImage2D(i.TEXTURE_2D,ee,0,0,ce.width,ce.height,he,Ce,ce.data):t.texImage2D(i.TEXTURE_2D,ee,ye,ce.width,ce.height,0,he,Ce,ce.data);g.generateMipmaps=!1}else I?(ie&&t.texStorage2D(i.TEXTURE_2D,pe,ye,ne.width,ne.height),se&&$e(g,ne,he,Ce)):t.texImage2D(i.TEXTURE_2D,0,ye,ne.width,ne.height,0,he,Ce,ne.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){I&&ie&&t.texStorage3D(i.TEXTURE_2D_ARRAY,pe,ye,Ne[0].width,Ne[0].height,ne.depth);for(let ee=0,$=Ne.length;ee<$;ee++)if(ce=Ne[ee],g.format!==bn)if(he!==null)if(I){if(se)if(g.layerUpdates.size>0){const _e=nc(ce.width,ce.height,g.format,g.type);for(const Ie of g.layerUpdates){const lt=ce.data.subarray(Ie*_e/ce.data.BYTES_PER_ELEMENT,(Ie+1)*_e/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,Ie,ce.width,ce.height,1,he,lt)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,0,ce.width,ce.height,ne.depth,he,ce.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ee,ye,ce.width,ce.height,ne.depth,0,ce.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else I?se&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,0,ce.width,ce.height,ne.depth,he,Ce,ce.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ee,ye,ce.width,ce.height,ne.depth,0,he,Ce,ce.data)}else{I&&ie&&t.texStorage2D(i.TEXTURE_2D,pe,ye,Ne[0].width,Ne[0].height);for(let ee=0,$=Ne.length;ee<$;ee++)ce=Ne[ee],g.format!==bn?he!==null?I?se&&t.compressedTexSubImage2D(i.TEXTURE_2D,ee,0,0,ce.width,ce.height,he,ce.data):t.compressedTexImage2D(i.TEXTURE_2D,ee,ye,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):I?se&&t.texSubImage2D(i.TEXTURE_2D,ee,0,0,ce.width,ce.height,he,Ce,ce.data):t.texImage2D(i.TEXTURE_2D,ee,ye,ce.width,ce.height,0,he,Ce,ce.data)}else if(g.isDataArrayTexture)if(I){if(ie&&t.texStorage3D(i.TEXTURE_2D_ARRAY,pe,ye,ne.width,ne.height,ne.depth),se)if(g.layerUpdates.size>0){const ee=nc(ne.width,ne.height,g.format,g.type);for(const $ of g.layerUpdates){const _e=ne.data.subarray($*ee/ne.data.BYTES_PER_ELEMENT,($+1)*ee/ne.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,$,ne.width,ne.height,1,he,Ce,_e)}g.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,he,Ce,ne.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ye,ne.width,ne.height,ne.depth,0,he,Ce,ne.data);else if(g.isData3DTexture)I?(ie&&t.texStorage3D(i.TEXTURE_3D,pe,ye,ne.width,ne.height,ne.depth),se&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,he,Ce,ne.data)):t.texImage3D(i.TEXTURE_3D,0,ye,ne.width,ne.height,ne.depth,0,he,Ce,ne.data);else if(g.isFramebufferTexture){if(ie)if(I)t.texStorage2D(i.TEXTURE_2D,pe,ye,ne.width,ne.height);else{let ee=ne.width,$=ne.height;for(let _e=0;_e<pe;_e++)t.texImage2D(i.TEXTURE_2D,_e,ye,ee,$,0,he,Ce,null),ee>>=1,$>>=1}}else if(Ne.length>0){if(I&&ie){const ee=Mt(Ne[0]);t.texStorage2D(i.TEXTURE_2D,pe,ye,ee.width,ee.height)}for(let ee=0,$=Ne.length;ee<$;ee++)ce=Ne[ee],I?se&&t.texSubImage2D(i.TEXTURE_2D,ee,0,0,he,Ce,ce):t.texImage2D(i.TEXTURE_2D,ee,ye,he,Ce,ce);g.generateMipmaps=!1}else if(I){if(ie){const ee=Mt(ne);t.texStorage2D(i.TEXTURE_2D,pe,ye,ee.width,ee.height)}se&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,he,Ce,ne)}else t.texImage2D(i.TEXTURE_2D,0,ye,he,Ce,ne);p(g)&&u(X),Ee.__version=W.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function Q(b,g,B){if(g.image.length!==6)return;const X=ot(b,g),Z=g.source;t.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+B);const W=n.get(Z);if(Z.version!==W.__version||X===!0){t.activeTexture(i.TEXTURE0+B);const Ee=Ke.getPrimaries(Ke.workingColorSpace),re=g.colorSpace===oi?null:Ke.getPrimaries(g.colorSpace),Me=g.colorSpace===oi||Ee===re?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Me);const Se=g.isCompressedTexture||g.image[0].isCompressedTexture,ne=g.image[0]&&g.image[0].isDataTexture,he=[];for(let $=0;$<6;$++)!Se&&!ne?he[$]=x(g.image[$],!0,r.maxCubemapSize):he[$]=ne?g.image[$].image:g.image[$],he[$]=Rt(g,he[$]);const Ce=he[0],ye=s.convert(g.format,g.colorSpace),ce=s.convert(g.type),Ne=T(g.internalFormat,ye,ce,g.colorSpace),I=g.isVideoTexture!==!0,ie=W.__version===void 0||X===!0,se=Z.dataReady;let pe=R(g,Ce);He(i.TEXTURE_CUBE_MAP,g);let ee;if(Se){I&&ie&&t.texStorage2D(i.TEXTURE_CUBE_MAP,pe,Ne,Ce.width,Ce.height);for(let $=0;$<6;$++){ee=he[$].mipmaps;for(let _e=0;_e<ee.length;_e++){const Ie=ee[_e];g.format!==bn?ye!==null?I?se&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e,0,0,Ie.width,Ie.height,ye,Ie.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e,Ne,Ie.width,Ie.height,0,Ie.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):I?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e,0,0,Ie.width,Ie.height,ye,ce,Ie.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e,Ne,Ie.width,Ie.height,0,ye,ce,Ie.data)}}}else{if(ee=g.mipmaps,I&&ie){ee.length>0&&pe++;const $=Mt(he[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,pe,Ne,$.width,$.height)}for(let $=0;$<6;$++)if(ne){I?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,he[$].width,he[$].height,ye,ce,he[$].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Ne,he[$].width,he[$].height,0,ye,ce,he[$].data);for(let _e=0;_e<ee.length;_e++){const lt=ee[_e].image[$].image;I?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e+1,0,0,lt.width,lt.height,ye,ce,lt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e+1,Ne,lt.width,lt.height,0,ye,ce,lt.data)}}else{I?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,ye,ce,he[$]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Ne,ye,ce,he[$]);for(let _e=0;_e<ee.length;_e++){const Ie=ee[_e];I?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e+1,0,0,ye,ce,Ie.image[$]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,_e+1,Ne,ye,ce,Ie.image[$])}}}p(g)&&u(i.TEXTURE_CUBE_MAP),W.__version=Z.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function me(b,g,B,X,Z,W){const Ee=s.convert(B.format,B.colorSpace),re=s.convert(B.type),Me=T(B.internalFormat,Ee,re,B.colorSpace),Se=n.get(g),ne=n.get(B);if(ne.__renderTarget=g,!Se.__hasExternalTextures){const he=Math.max(1,g.width>>W),Ce=Math.max(1,g.height>>W);Z===i.TEXTURE_3D||Z===i.TEXTURE_2D_ARRAY?t.texImage3D(Z,W,Me,he,Ce,g.depth,0,Ee,re,null):t.texImage2D(Z,W,Me,he,Ce,0,Ee,re,null)}t.bindFramebuffer(i.FRAMEBUFFER,b),ve(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,Z,ne.__webglTexture,0,ft(g)):(Z===i.TEXTURE_2D||Z>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,Z,ne.__webglTexture,W),t.bindFramebuffer(i.FRAMEBUFFER,null)}function De(b,g,B){if(i.bindRenderbuffer(i.RENDERBUFFER,b),g.depthBuffer){const X=g.depthTexture,Z=X&&X.isDepthTexture?X.type:null,W=M(g.stencilBuffer,Z),Ee=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=ft(g);ve(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,re,W,g.width,g.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,re,W,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,W,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ee,i.RENDERBUFFER,b)}else{const X=g.textures;for(let Z=0;Z<X.length;Z++){const W=X[Z],Ee=s.convert(W.format,W.colorSpace),re=s.convert(W.type),Me=T(W.internalFormat,Ee,re,W.colorSpace),Se=ft(g);B&&ve(g)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Se,Me,g.width,g.height):ve(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Se,Me,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,Me,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Te(b,g){if(g&&g.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,b),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const X=n.get(g.depthTexture);X.__renderTarget=g,(!X.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),q(g.depthTexture,0);const Z=X.__webglTexture,W=ft(g);if(g.depthTexture.format===jr)ve(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0,W):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0);else if(g.depthTexture.format===$r)ve(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0,W):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function Xe(b){const g=n.get(b),B=b.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==b.depthTexture){const X=b.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),X){const Z=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,X.removeEventListener("dispose",Z)};X.addEventListener("dispose",Z),g.__depthDisposeCallback=Z}g.__boundDepthTexture=X}if(b.depthTexture&&!g.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");const X=b.texture.mipmaps;X&&X.length>0?Te(g.__webglFramebuffer[0],b):Te(g.__webglFramebuffer,b)}else if(B){g.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[X]),g.__webglDepthbuffer[X]===void 0)g.__webglDepthbuffer[X]=i.createRenderbuffer(),De(g.__webglDepthbuffer[X],b,!1);else{const Z=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,W=g.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,W),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,W)}}else{const X=b.texture.mipmaps;if(X&&X.length>0?t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),De(g.__webglDepthbuffer,b,!1);else{const Z=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,W=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,W),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,W)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Nt(b,g,B){const X=n.get(b);g!==void 0&&me(X.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&Xe(b)}function C(b){const g=b.texture,B=n.get(b),X=n.get(g);b.addEventListener("dispose",P);const Z=b.textures,W=b.isWebGLCubeRenderTarget===!0,Ee=Z.length>1;if(Ee||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=g.version,a.memory.textures++),W){B.__webglFramebuffer=[];for(let re=0;re<6;re++)if(g.mipmaps&&g.mipmaps.length>0){B.__webglFramebuffer[re]=[];for(let Me=0;Me<g.mipmaps.length;Me++)B.__webglFramebuffer[re][Me]=i.createFramebuffer()}else B.__webglFramebuffer[re]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){B.__webglFramebuffer=[];for(let re=0;re<g.mipmaps.length;re++)B.__webglFramebuffer[re]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(Ee)for(let re=0,Me=Z.length;re<Me;re++){const Se=n.get(Z[re]);Se.__webglTexture===void 0&&(Se.__webglTexture=i.createTexture(),a.memory.textures++)}if(b.samples>0&&ve(b)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let re=0;re<Z.length;re++){const Me=Z[re];B.__webglColorRenderbuffer[re]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[re]);const Se=s.convert(Me.format,Me.colorSpace),ne=s.convert(Me.type),he=T(Me.internalFormat,Se,ne,Me.colorSpace,b.isXRRenderTarget===!0),Ce=ft(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ce,he,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,B.__webglColorRenderbuffer[re])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),De(B.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(W){t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),He(i.TEXTURE_CUBE_MAP,g);for(let re=0;re<6;re++)if(g.mipmaps&&g.mipmaps.length>0)for(let Me=0;Me<g.mipmaps.length;Me++)me(B.__webglFramebuffer[re][Me],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+re,Me);else me(B.__webglFramebuffer[re],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+re,0);p(g)&&u(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ee){for(let re=0,Me=Z.length;re<Me;re++){const Se=Z[re],ne=n.get(Se);let he=i.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(he=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(he,ne.__webglTexture),He(he,Se),me(B.__webglFramebuffer,b,Se,i.COLOR_ATTACHMENT0+re,he,0),p(Se)&&u(he)}t.unbindTexture()}else{let re=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(re=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(re,X.__webglTexture),He(re,g),g.mipmaps&&g.mipmaps.length>0)for(let Me=0;Me<g.mipmaps.length;Me++)me(B.__webglFramebuffer[Me],b,g,i.COLOR_ATTACHMENT0,re,Me);else me(B.__webglFramebuffer,b,g,i.COLOR_ATTACHMENT0,re,0);p(g)&&u(re),t.unbindTexture()}b.depthBuffer&&Xe(b)}function dt(b){const g=b.textures;for(let B=0,X=g.length;B<X;B++){const Z=g[B];if(p(Z)){const W=E(b),Ee=n.get(Z).__webglTexture;t.bindTexture(W,Ee),u(W),t.unbindTexture()}}}const Ue=[],Pe=[];function xe(b){if(b.samples>0){if(ve(b)===!1){const g=b.textures,B=b.width,X=b.height;let Z=i.COLOR_BUFFER_BIT;const W=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ee=n.get(b),re=g.length>1;if(re)for(let Se=0;Se<g.length;Se++)t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer);const Me=b.texture.mipmaps;Me&&Me.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer);for(let Se=0;Se<g.length;Se++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(Z|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(Z|=i.STENCIL_BUFFER_BIT)),re){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);const ne=n.get(g[Se]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ne,0)}i.blitFramebuffer(0,0,B,X,0,0,B,X,Z,i.NEAREST),c===!0&&(Ue.length=0,Pe.length=0,Ue.push(i.COLOR_ATTACHMENT0+Se),b.depthBuffer&&b.resolveDepthBuffer===!1&&(Ue.push(W),Pe.push(W),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Pe)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ue))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),re)for(let Se=0;Se<g.length;Se++){t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);const ne=n.get(g[Se]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.TEXTURE_2D,ne,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&c){const g=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function ft(b){return Math.min(r.maxSamples,b.samples)}function ve(b){const g=n.get(b);return b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function Be(b){const g=a.render.frame;h.get(b)!==g&&(h.set(b,g),b.update())}function Rt(b,g){const B=b.colorSpace,X=b.format,Z=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||B!==Mr&&B!==oi&&(Ke.getTransfer(B)===et?(X!==bn||Z!==Fn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),g}function Mt(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(l.width=b.naturalWidth||b.width,l.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(l.width=b.displayWidth,l.height=b.displayHeight):(l.width=b.width,l.height=b.height),l}this.allocateTextureUnit=H,this.resetTextureUnits=O,this.setTexture2D=q,this.setTexture2DArray=Y,this.setTexture3D=J,this.setTextureCube=G,this.rebindTextures=Nt,this.setupRenderTarget=C,this.updateRenderTargetMipmap=dt,this.updateMultisampleRenderTarget=xe,this.setupDepthRenderbuffer=Xe,this.setupFrameBufferTexture=me,this.useMultisampledRTT=ve}function c0(i,e){function t(n,r=oi){let s;const a=Ke.getTransfer(r);if(n===Fn)return i.UNSIGNED_BYTE;if(n===Go)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Wo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Vc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Hc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===zc)return i.BYTE;if(n===kc)return i.SHORT;if(n===Yr)return i.UNSIGNED_SHORT;if(n===Ho)return i.INT;if(n===Fi)return i.UNSIGNED_INT;if(n===Un)return i.FLOAT;if(n===is)return i.HALF_FLOAT;if(n===Gc)return i.ALPHA;if(n===Wc)return i.RGB;if(n===bn)return i.RGBA;if(n===jr)return i.DEPTH_COMPONENT;if(n===$r)return i.DEPTH_STENCIL;if(n===Xo)return i.RED;if(n===qo)return i.RED_INTEGER;if(n===Xc)return i.RG;if(n===Yo)return i.RG_INTEGER;if(n===Ko)return i.RGBA_INTEGER;if(n===ks||n===Vs||n===Hs||n===Gs)if(a===et)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===ks)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Vs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Hs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Gs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===ks)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Vs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Hs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Gs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ao||n===oo||n===lo||n===co)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===ao)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===oo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===lo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===co)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===uo||n===ho||n===fo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===uo||n===ho)return a===et?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===fo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===po||n===mo||n===go||n===_o||n===xo||n===vo||n===Mo||n===So||n===yo||n===Eo||n===To||n===bo||n===Ao||n===wo)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===po)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===mo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===go)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===_o)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===xo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===vo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Mo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===So)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===yo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Eo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===To)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===bo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ao)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===wo)return a===et?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ro||n===Co||n===Po)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===Ro)return a===et?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Co)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Po)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Lo||n===Do||n===Io||n===Uo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Lo)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Do)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Io)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Uo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Kr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const u0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,h0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class d0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new au(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new On({vertexShader:u0,fragmentShader:h0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Et(new Yi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class f0 extends Tr{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",c=1,l=null,h=null,d=null,f=null,m=null,_=null;const x=typeof XRWebGLBinding<"u",p=new d0,u={},E=t.getContextAttributes();let T=null,M=null;const R=[],A=[],P=new Oe;let U=null;const y=new rn;y.viewport=new nt;const S=new rn;S.viewport=new nt;const D=[y,S],O=new Ld;let H=null,K=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let Q=R[j];return Q===void 0&&(Q=new Ua,R[j]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(j){let Q=R[j];return Q===void 0&&(Q=new Ua,R[j]=Q),Q.getGripSpace()},this.getHand=function(j){let Q=R[j];return Q===void 0&&(Q=new Ua,R[j]=Q),Q.getHandSpace()};function q(j){const Q=A.indexOf(j.inputSource);if(Q===-1)return;const me=R[Q];me!==void 0&&(me.update(j.inputSource,j.frame,l||a),me.dispatchEvent({type:j.type,data:j.inputSource}))}function Y(){r.removeEventListener("select",q),r.removeEventListener("selectstart",q),r.removeEventListener("selectend",q),r.removeEventListener("squeeze",q),r.removeEventListener("squeezestart",q),r.removeEventListener("squeezeend",q),r.removeEventListener("end",Y),r.removeEventListener("inputsourceschange",J);for(let j=0;j<R.length;j++){const Q=A[j];Q!==null&&(A[j]=null,R[j].disconnect(Q))}H=null,K=null,p.reset();for(const j in u)delete u[j];e.setRenderTarget(T),m=null,f=null,d=null,r=null,M=null,$e.stop(),n.isPresenting=!1,e.setPixelRatio(U),e.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){s=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(j){l=j},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return d===null&&x&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(j){if(r=j,r!==null){if(T=e.getRenderTarget(),r.addEventListener("select",q),r.addEventListener("selectstart",q),r.addEventListener("selectend",q),r.addEventListener("squeeze",q),r.addEventListener("squeezestart",q),r.addEventListener("squeezeend",q),r.addEventListener("end",Y),r.addEventListener("inputsourceschange",J),E.xrCompatible!==!0&&await t.makeXRCompatible(),U=e.getPixelRatio(),e.getSize(P),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let me=null,De=null,Te=null;E.depth&&(Te=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,me=E.stencil?$r:jr,De=E.stencil?Kr:Fi);const Xe={colorFormat:t.RGBA8,depthFormat:Te,scaleFactor:s};d=this.getBinding(),f=d.createProjectionLayer(Xe),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),M=new mi(f.textureWidth,f.textureHeight,{format:bn,type:Fn,depthTexture:new su(f.textureWidth,f.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,me),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{const me={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,me),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),M=new mi(m.framebufferWidth,m.framebufferHeight,{format:bn,type:Fn,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await r.requestReferenceSpace(o),$e.setContext(r),$e.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function J(j){for(let Q=0;Q<j.removed.length;Q++){const me=j.removed[Q],De=A.indexOf(me);De>=0&&(A[De]=null,R[De].disconnect(me))}for(let Q=0;Q<j.added.length;Q++){const me=j.added[Q];let De=A.indexOf(me);if(De===-1){for(let Xe=0;Xe<R.length;Xe++)if(Xe>=A.length){A.push(me),De=Xe;break}else if(A[Xe]===null){A[Xe]=me,De=Xe;break}if(De===-1)break}const Te=R[De];Te&&Te.connect(me)}}const G=new L,le=new L;function de(j,Q,me){G.setFromMatrixPosition(Q.matrixWorld),le.setFromMatrixPosition(me.matrixWorld);const De=G.distanceTo(le),Te=Q.projectionMatrix.elements,Xe=me.projectionMatrix.elements,Nt=Te[14]/(Te[10]-1),C=Te[14]/(Te[10]+1),dt=(Te[9]+1)/Te[5],Ue=(Te[9]-1)/Te[5],Pe=(Te[8]-1)/Te[0],xe=(Xe[8]+1)/Xe[0],ft=Nt*Pe,ve=Nt*xe,Be=De/(-Pe+xe),Rt=Be*-Pe;if(Q.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Rt),j.translateZ(Be),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),Te[10]===-1)j.projectionMatrix.copy(Q.projectionMatrix),j.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{const Mt=Nt+Be,b=C+Be,g=ft-Rt,B=ve+(De-Rt),X=dt*C/b*Mt,Z=Ue*C/b*Mt;j.projectionMatrix.makePerspective(g,B,X,Z,Mt,b),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function be(j,Q){Q===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(Q.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(r===null)return;let Q=j.near,me=j.far;p.texture!==null&&(p.depthNear>0&&(Q=p.depthNear),p.depthFar>0&&(me=p.depthFar)),O.near=S.near=y.near=Q,O.far=S.far=y.far=me,(H!==O.near||K!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),H=O.near,K=O.far),O.layers.mask=j.layers.mask|6,y.layers.mask=O.layers.mask&3,S.layers.mask=O.layers.mask&5;const De=j.parent,Te=O.cameras;be(O,De);for(let Xe=0;Xe<Te.length;Xe++)be(Te[Xe],De);Te.length===2?de(O,y,S):O.projectionMatrix.copy(y.projectionMatrix),He(j,O,De)};function He(j,Q,me){me===null?j.matrix.copy(Q.matrixWorld):(j.matrix.copy(me.matrixWorld),j.matrix.invert(),j.matrix.multiply(Q.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(Q.projectionMatrix),j.projectionMatrixInverse.copy(Q.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Zr*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(f===null&&m===null))return c},this.setFoveation=function(j){c=j,f!==null&&(f.fixedFoveation=j),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=j)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(O)},this.getCameraTexture=function(j){return u[j]};let ot=null;function ht(j,Q){if(h=Q.getViewerPose(l||a),_=Q,h!==null){const me=h.views;m!==null&&(e.setRenderTargetFramebuffer(M,m.framebuffer),e.setRenderTarget(M));let De=!1;me.length!==O.cameras.length&&(O.cameras.length=0,De=!0);for(let C=0;C<me.length;C++){const dt=me[C];let Ue=null;if(m!==null)Ue=m.getViewport(dt);else{const xe=d.getViewSubImage(f,dt);Ue=xe.viewport,C===0&&(e.setRenderTargetTextures(M,xe.colorTexture,xe.depthStencilTexture),e.setRenderTarget(M))}let Pe=D[C];Pe===void 0&&(Pe=new rn,Pe.layers.enable(C),Pe.viewport=new nt,D[C]=Pe),Pe.matrix.fromArray(dt.transform.matrix),Pe.matrix.decompose(Pe.position,Pe.quaternion,Pe.scale),Pe.projectionMatrix.fromArray(dt.projectionMatrix),Pe.projectionMatrixInverse.copy(Pe.projectionMatrix).invert(),Pe.viewport.set(Ue.x,Ue.y,Ue.width,Ue.height),C===0&&(O.matrix.copy(Pe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),De===!0&&O.cameras.push(Pe)}const Te=r.enabledFeatures;if(Te&&Te.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&x){d=n.getBinding();const C=d.getDepthInformation(me[0]);C&&C.isValid&&C.texture&&p.init(C,r.renderState)}if(Te&&Te.includes("camera-access")&&x){e.state.unbindTexture(),d=n.getBinding();for(let C=0;C<me.length;C++){const dt=me[C].camera;if(dt){let Ue=u[dt];Ue||(Ue=new au,u[dt]=Ue);const Pe=d.getCameraImage(dt);Ue.sourceTexture=Pe}}}}for(let me=0;me<R.length;me++){const De=A[me],Te=R[me];De!==null&&Te!==void 0&&Te.update(De,Q,l||a)}ot&&ot(j,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),_=null}const $e=new lu;$e.setAnimationLoop(ht),this.setAnimationLoop=function(j){ot=j},this.dispose=function(){}}}const Ai=new jn,p0=new rt;function m0(i,e){function t(p,u){p.matrixAutoUpdate===!0&&p.updateMatrix(),u.value.copy(p.matrix)}function n(p,u){u.color.getRGB(p.fogColor.value,Qc(i)),u.isFog?(p.fogNear.value=u.near,p.fogFar.value=u.far):u.isFogExp2&&(p.fogDensity.value=u.density)}function r(p,u,E,T,M){u.isMeshBasicMaterial||u.isMeshLambertMaterial?s(p,u):u.isMeshToonMaterial?(s(p,u),d(p,u)):u.isMeshPhongMaterial?(s(p,u),h(p,u)):u.isMeshStandardMaterial?(s(p,u),f(p,u),u.isMeshPhysicalMaterial&&m(p,u,M)):u.isMeshMatcapMaterial?(s(p,u),_(p,u)):u.isMeshDepthMaterial?s(p,u):u.isMeshDistanceMaterial?(s(p,u),x(p,u)):u.isMeshNormalMaterial?s(p,u):u.isLineBasicMaterial?(a(p,u),u.isLineDashedMaterial&&o(p,u)):u.isPointsMaterial?c(p,u,E,T):u.isSpriteMaterial?l(p,u):u.isShadowMaterial?(p.color.value.copy(u.color),p.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function s(p,u){p.opacity.value=u.opacity,u.color&&p.diffuse.value.copy(u.color),u.emissive&&p.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(p.map.value=u.map,t(u.map,p.mapTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,t(u.alphaMap,p.alphaMapTransform)),u.bumpMap&&(p.bumpMap.value=u.bumpMap,t(u.bumpMap,p.bumpMapTransform),p.bumpScale.value=u.bumpScale,u.side===Bt&&(p.bumpScale.value*=-1)),u.normalMap&&(p.normalMap.value=u.normalMap,t(u.normalMap,p.normalMapTransform),p.normalScale.value.copy(u.normalScale),u.side===Bt&&p.normalScale.value.negate()),u.displacementMap&&(p.displacementMap.value=u.displacementMap,t(u.displacementMap,p.displacementMapTransform),p.displacementScale.value=u.displacementScale,p.displacementBias.value=u.displacementBias),u.emissiveMap&&(p.emissiveMap.value=u.emissiveMap,t(u.emissiveMap,p.emissiveMapTransform)),u.specularMap&&(p.specularMap.value=u.specularMap,t(u.specularMap,p.specularMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest);const E=e.get(u),T=E.envMap,M=E.envMapRotation;T&&(p.envMap.value=T,Ai.copy(M),Ai.x*=-1,Ai.y*=-1,Ai.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(Ai.y*=-1,Ai.z*=-1),p.envMapRotation.value.setFromMatrix4(p0.makeRotationFromEuler(Ai)),p.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=u.reflectivity,p.ior.value=u.ior,p.refractionRatio.value=u.refractionRatio),u.lightMap&&(p.lightMap.value=u.lightMap,p.lightMapIntensity.value=u.lightMapIntensity,t(u.lightMap,p.lightMapTransform)),u.aoMap&&(p.aoMap.value=u.aoMap,p.aoMapIntensity.value=u.aoMapIntensity,t(u.aoMap,p.aoMapTransform))}function a(p,u){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,u.map&&(p.map.value=u.map,t(u.map,p.mapTransform))}function o(p,u){p.dashSize.value=u.dashSize,p.totalSize.value=u.dashSize+u.gapSize,p.scale.value=u.scale}function c(p,u,E,T){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,p.size.value=u.size*E,p.scale.value=T*.5,u.map&&(p.map.value=u.map,t(u.map,p.uvTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,t(u.alphaMap,p.alphaMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest)}function l(p,u){p.diffuse.value.copy(u.color),p.opacity.value=u.opacity,p.rotation.value=u.rotation,u.map&&(p.map.value=u.map,t(u.map,p.mapTransform)),u.alphaMap&&(p.alphaMap.value=u.alphaMap,t(u.alphaMap,p.alphaMapTransform)),u.alphaTest>0&&(p.alphaTest.value=u.alphaTest)}function h(p,u){p.specular.value.copy(u.specular),p.shininess.value=Math.max(u.shininess,1e-4)}function d(p,u){u.gradientMap&&(p.gradientMap.value=u.gradientMap)}function f(p,u){p.metalness.value=u.metalness,u.metalnessMap&&(p.metalnessMap.value=u.metalnessMap,t(u.metalnessMap,p.metalnessMapTransform)),p.roughness.value=u.roughness,u.roughnessMap&&(p.roughnessMap.value=u.roughnessMap,t(u.roughnessMap,p.roughnessMapTransform)),u.envMap&&(p.envMapIntensity.value=u.envMapIntensity)}function m(p,u,E){p.ior.value=u.ior,u.sheen>0&&(p.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),p.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(p.sheenColorMap.value=u.sheenColorMap,t(u.sheenColorMap,p.sheenColorMapTransform)),u.sheenRoughnessMap&&(p.sheenRoughnessMap.value=u.sheenRoughnessMap,t(u.sheenRoughnessMap,p.sheenRoughnessMapTransform))),u.clearcoat>0&&(p.clearcoat.value=u.clearcoat,p.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(p.clearcoatMap.value=u.clearcoatMap,t(u.clearcoatMap,p.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,t(u.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(p.clearcoatNormalMap.value=u.clearcoatNormalMap,t(u.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===Bt&&p.clearcoatNormalScale.value.negate())),u.dispersion>0&&(p.dispersion.value=u.dispersion),u.iridescence>0&&(p.iridescence.value=u.iridescence,p.iridescenceIOR.value=u.iridescenceIOR,p.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(p.iridescenceMap.value=u.iridescenceMap,t(u.iridescenceMap,p.iridescenceMapTransform)),u.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=u.iridescenceThicknessMap,t(u.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),u.transmission>0&&(p.transmission.value=u.transmission,p.transmissionSamplerMap.value=E.texture,p.transmissionSamplerSize.value.set(E.width,E.height),u.transmissionMap&&(p.transmissionMap.value=u.transmissionMap,t(u.transmissionMap,p.transmissionMapTransform)),p.thickness.value=u.thickness,u.thicknessMap&&(p.thicknessMap.value=u.thicknessMap,t(u.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=u.attenuationDistance,p.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(p.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(p.anisotropyMap.value=u.anisotropyMap,t(u.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=u.specularIntensity,p.specularColor.value.copy(u.specularColor),u.specularColorMap&&(p.specularColorMap.value=u.specularColorMap,t(u.specularColorMap,p.specularColorMapTransform)),u.specularIntensityMap&&(p.specularIntensityMap.value=u.specularIntensityMap,t(u.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,u){u.matcap&&(p.matcap.value=u.matcap)}function x(p,u){const E=e.get(u).light;p.referencePosition.value.setFromMatrixPosition(E.matrixWorld),p.nearDistance.value=E.shadow.camera.near,p.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function g0(i,e,t,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(E,T){const M=T.program;n.uniformBlockBinding(E,M)}function l(E,T){let M=r[E.id];M===void 0&&(_(E),M=h(E),r[E.id]=M,E.addEventListener("dispose",p));const R=T.program;n.updateUBOMapping(E,R);const A=e.render.frame;s[E.id]!==A&&(f(E),s[E.id]=A)}function h(E){const T=d();E.__bindingPointIndex=T;const M=i.createBuffer(),R=E.__size,A=E.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,R,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,M),M}function d(){for(let E=0;E<o;E++)if(a.indexOf(E)===-1)return a.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(E){const T=r[E.id],M=E.uniforms,R=E.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let A=0,P=M.length;A<P;A++){const U=Array.isArray(M[A])?M[A]:[M[A]];for(let y=0,S=U.length;y<S;y++){const D=U[y];if(m(D,A,y,R)===!0){const O=D.__offset,H=Array.isArray(D.value)?D.value:[D.value];let K=0;for(let q=0;q<H.length;q++){const Y=H[q],J=x(Y);typeof Y=="number"||typeof Y=="boolean"?(D.__data[0]=Y,i.bufferSubData(i.UNIFORM_BUFFER,O+K,D.__data)):Y.isMatrix3?(D.__data[0]=Y.elements[0],D.__data[1]=Y.elements[1],D.__data[2]=Y.elements[2],D.__data[3]=0,D.__data[4]=Y.elements[3],D.__data[5]=Y.elements[4],D.__data[6]=Y.elements[5],D.__data[7]=0,D.__data[8]=Y.elements[6],D.__data[9]=Y.elements[7],D.__data[10]=Y.elements[8],D.__data[11]=0):(Y.toArray(D.__data,K),K+=J.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,O,D.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(E,T,M,R){const A=E.value,P=T+"_"+M;if(R[P]===void 0)return typeof A=="number"||typeof A=="boolean"?R[P]=A:R[P]=A.clone(),!0;{const U=R[P];if(typeof A=="number"||typeof A=="boolean"){if(U!==A)return R[P]=A,!0}else if(U.equals(A)===!1)return U.copy(A),!0}return!1}function _(E){const T=E.uniforms;let M=0;const R=16;for(let P=0,U=T.length;P<U;P++){const y=Array.isArray(T[P])?T[P]:[T[P]];for(let S=0,D=y.length;S<D;S++){const O=y[S],H=Array.isArray(O.value)?O.value:[O.value];for(let K=0,q=H.length;K<q;K++){const Y=H[K],J=x(Y),G=M%R,le=G%J.boundary,de=G+le;M+=le,de!==0&&R-de<J.storage&&(M+=R-de),O.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=M,M+=J.storage}}}const A=M%R;return A>0&&(M+=R-A),E.__size=M,E.__cache={},this}function x(E){const T={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(T.boundary=4,T.storage=4):E.isVector2?(T.boundary=8,T.storage=8):E.isVector3||E.isColor?(T.boundary=16,T.storage=12):E.isVector4?(T.boundary=16,T.storage=16):E.isMatrix3?(T.boundary=48,T.storage=48):E.isMatrix4?(T.boundary=64,T.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),T}function p(E){const T=E.target;T.removeEventListener("dispose",p);const M=a.indexOf(T.__bindingPointIndex);a.splice(M,1),i.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function u(){for(const E in r)i.deleteBuffer(r[E]);a=[],r={},s={}}return{bind:c,update:l,dispose:u}}class _0{constructor(e={}){const{canvas:t=Xh(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;const _=new Uint32Array(4),x=new Int32Array(4);let p=null,u=null;const E=[],T=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=hi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const M=this;let R=!1;this._outputColorSpace=nn;let A=0,P=0,U=null,y=-1,S=null;const D=new nt,O=new nt;let H=null;const K=new Ve(0);let q=0,Y=t.width,J=t.height,G=1,le=null,de=null;const be=new nt(0,0,Y,J),He=new nt(0,0,Y,J);let ot=!1;const ht=new Qo;let $e=!1,j=!1;const Q=new rt,me=new L,De=new nt,Te={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Xe=!1;function Nt(){return U===null?G:1}let C=n;function dt(v,N){return t.getContext(v,N)}try{const v={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Vo}`),t.addEventListener("webglcontextlost",se,!1),t.addEventListener("webglcontextrestored",pe,!1),t.addEventListener("webglcontextcreationerror",ee,!1),C===null){const N="webgl2";if(C=dt(N,v),C===null)throw dt(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw console.error("THREE.WebGLRenderer: "+v.message),v}let Ue,Pe,xe,ft,ve,Be,Rt,Mt,b,g,B,X,Z,W,Ee,re,Me,Se,ne,he,Ce,ye,ce,Ne;function I(){Ue=new wm(C),Ue.init(),ye=new c0(C,Ue),Pe=new Mm(C,Ue,e,ye),xe=new o0(C,Ue),Pe.reversedDepthBuffer&&f&&xe.buffers.depth.setReversed(!0),ft=new Pm(C),ve=new Kg,Be=new l0(C,Ue,xe,ve,Pe,ye,ft),Rt=new ym(M),Mt=new Am(M),b=new Nd(C),ce=new xm(C,b),g=new Rm(C,b,ft,ce),B=new Dm(C,g,b,ft),ne=new Lm(C,Pe,Be),re=new Sm(ve),X=new Yg(M,Rt,Mt,Ue,Pe,ce,re),Z=new m0(M,ve),W=new $g,Ee=new n0(Ue),Se=new _m(M,Rt,Mt,xe,B,m,c),Me=new s0(M,B,Pe),Ne=new g0(C,ft,Pe,xe),he=new vm(C,Ue,ft),Ce=new Cm(C,Ue,ft),ft.programs=X.programs,M.capabilities=Pe,M.extensions=Ue,M.properties=ve,M.renderLists=W,M.shadowMap=Me,M.state=xe,M.info=ft}I();const ie=new f0(M,C);this.xr=ie,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){const v=Ue.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=Ue.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(v){v!==void 0&&(G=v,this.setSize(Y,J,!1))},this.getSize=function(v){return v.set(Y,J)},this.setSize=function(v,N,k=!0){if(ie.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=v,J=N,t.width=Math.floor(v*G),t.height=Math.floor(N*G),k===!0&&(t.style.width=v+"px",t.style.height=N+"px"),this.setViewport(0,0,v,N)},this.getDrawingBufferSize=function(v){return v.set(Y*G,J*G).floor()},this.setDrawingBufferSize=function(v,N,k){Y=v,J=N,G=k,t.width=Math.floor(v*k),t.height=Math.floor(N*k),this.setViewport(0,0,v,N)},this.getCurrentViewport=function(v){return v.copy(D)},this.getViewport=function(v){return v.copy(be)},this.setViewport=function(v,N,k,V){v.isVector4?be.set(v.x,v.y,v.z,v.w):be.set(v,N,k,V),xe.viewport(D.copy(be).multiplyScalar(G).round())},this.getScissor=function(v){return v.copy(He)},this.setScissor=function(v,N,k,V){v.isVector4?He.set(v.x,v.y,v.z,v.w):He.set(v,N,k,V),xe.scissor(O.copy(He).multiplyScalar(G).round())},this.getScissorTest=function(){return ot},this.setScissorTest=function(v){xe.setScissorTest(ot=v)},this.setOpaqueSort=function(v){le=v},this.setTransparentSort=function(v){de=v},this.getClearColor=function(v){return v.copy(Se.getClearColor())},this.setClearColor=function(){Se.setClearColor(...arguments)},this.getClearAlpha=function(){return Se.getClearAlpha()},this.setClearAlpha=function(){Se.setClearAlpha(...arguments)},this.clear=function(v=!0,N=!0,k=!0){let V=0;if(v){let F=!1;if(U!==null){const te=U.texture.format;F=te===Ko||te===Yo||te===qo}if(F){const te=U.texture.type,ue=te===Fn||te===Fi||te===Yr||te===Kr||te===Go||te===Wo,ge=Se.getClearColor(),fe=Se.getClearAlpha(),Re=ge.r,Le=ge.g,Ae=ge.b;ue?(_[0]=Re,_[1]=Le,_[2]=Ae,_[3]=fe,C.clearBufferuiv(C.COLOR,0,_)):(x[0]=Re,x[1]=Le,x[2]=Ae,x[3]=fe,C.clearBufferiv(C.COLOR,0,x))}else V|=C.COLOR_BUFFER_BIT}N&&(V|=C.DEPTH_BUFFER_BIT),k&&(V|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),C.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",se,!1),t.removeEventListener("webglcontextrestored",pe,!1),t.removeEventListener("webglcontextcreationerror",ee,!1),Se.dispose(),W.dispose(),Ee.dispose(),ve.dispose(),Rt.dispose(),Mt.dispose(),B.dispose(),ce.dispose(),Ne.dispose(),X.dispose(),ie.dispose(),ie.removeEventListener("sessionstart",Rn),ie.removeEventListener("sessionend",hl),vi.stop()};function se(v){v.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),R=!0}function pe(){console.log("THREE.WebGLRenderer: Context Restored."),R=!1;const v=ft.autoReset,N=Me.enabled,k=Me.autoUpdate,V=Me.needsUpdate,F=Me.type;I(),ft.autoReset=v,Me.enabled=N,Me.autoUpdate=k,Me.needsUpdate=V,Me.type=F}function ee(v){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function $(v){const N=v.target;N.removeEventListener("dispose",$),_e(N)}function _e(v){Ie(v),ve.remove(v)}function Ie(v){const N=ve.get(v).programs;N!==void 0&&(N.forEach(function(k){X.releaseProgram(k)}),v.isShaderMaterial&&X.releaseShaderCache(v))}this.renderBufferDirect=function(v,N,k,V,F,te){N===null&&(N=Te);const ue=F.isMesh&&F.matrixWorld.determinant()<0,ge=Bu(v,N,k,V,F);xe.setMaterial(V,ue);let fe=k.index,Re=1;if(V.wireframe===!0){if(fe=g.getWireframeAttribute(k),fe===void 0)return;Re=2}const Le=k.drawRange,Ae=k.attributes.position;let Ge=Le.start*Re,Qe=(Le.start+Le.count)*Re;te!==null&&(Ge=Math.max(Ge,te.start*Re),Qe=Math.min(Qe,(te.start+te.count)*Re)),fe!==null?(Ge=Math.max(Ge,0),Qe=Math.min(Qe,fe.count)):Ae!=null&&(Ge=Math.max(Ge,0),Qe=Math.min(Qe,Ae.count));const vt=Qe-Ge;if(vt<0||vt===1/0)return;ce.setup(F,V,ge,k,fe);let ut,st=he;if(fe!==null&&(ut=b.get(fe),st=Ce,st.setIndex(ut)),F.isMesh)V.wireframe===!0?(xe.setLineWidth(V.wireframeLinewidth*Nt()),st.setMode(C.LINES)):st.setMode(C.TRIANGLES);else if(F.isLine){let we=V.linewidth;we===void 0&&(we=1),xe.setLineWidth(we*Nt()),F.isLineSegments?st.setMode(C.LINES):F.isLineLoop?st.setMode(C.LINE_LOOP):st.setMode(C.LINE_STRIP)}else F.isPoints?st.setMode(C.POINTS):F.isSprite&&st.setMode(C.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)Jr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),st.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(Ue.get("WEBGL_multi_draw"))st.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{const we=F._multiDrawStarts,gt=F._multiDrawCounts,Ye=F._multiDrawCount,Jt=fe?b.get(fe).bytesPerElement:1,$i=ve.get(V).currentProgram.getUniforms();for(let Qt=0;Qt<Ye;Qt++)$i.setValue(C,"_gl_DrawID",Qt),st.render(we[Qt]/Jt,gt[Qt])}else if(F.isInstancedMesh)st.renderInstances(Ge,vt,F.count);else if(k.isInstancedBufferGeometry){const we=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,gt=Math.min(k.instanceCount,we);st.renderInstances(Ge,vt,gt)}else st.render(Ge,vt)};function lt(v,N,k){v.transparent===!0&&v.side===gn&&v.forceSinglePass===!1?(v.side=Bt,v.needsUpdate=!0,ds(v,N,k),v.side=pi,v.needsUpdate=!0,ds(v,N,k),v.side=gn):ds(v,N,k)}this.compile=function(v,N,k=null){k===null&&(k=v),u=Ee.get(k),u.init(N),T.push(u),k.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(u.pushLight(F),F.castShadow&&u.pushShadow(F))}),v!==k&&v.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(u.pushLight(F),F.castShadow&&u.pushShadow(F))}),u.setupLights();const V=new Set;return v.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;const te=F.material;if(te)if(Array.isArray(te))for(let ue=0;ue<te.length;ue++){const ge=te[ue];lt(ge,k,F),V.add(ge)}else lt(te,k,F),V.add(te)}),u=T.pop(),V},this.compileAsync=function(v,N,k=null){const V=this.compile(v,N,k);return new Promise(F=>{function te(){if(V.forEach(function(ue){ve.get(ue).currentProgram.isReady()&&V.delete(ue)}),V.size===0){F(v);return}setTimeout(te,10)}Ue.get("KHR_parallel_shader_compile")!==null?te():setTimeout(te,10)})};let Ze=null;function Bn(v){Ze&&Ze(v)}function Rn(){vi.stop()}function hl(){vi.start()}const vi=new lu;vi.setAnimationLoop(Bn),typeof self<"u"&&vi.setContext(self),this.setAnimationLoop=function(v){Ze=v,ie.setAnimationLoop(v),v===null?vi.stop():vi.start()},ie.addEventListener("sessionstart",Rn),ie.addEventListener("sessionend",hl),this.render=function(v,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),ie.enabled===!0&&ie.isPresenting===!0&&(ie.cameraAutoUpdate===!0&&ie.updateCamera(N),N=ie.getCamera()),v.isScene===!0&&v.onBeforeRender(M,v,N,U),u=Ee.get(v,T.length),u.init(N),T.push(u),Q.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),ht.setFromProjectionMatrix(Q,Nn,N.reversedDepth),j=this.localClippingEnabled,$e=re.init(this.clippingPlanes,j),p=W.get(v,E.length),p.init(),E.push(p),ie.enabled===!0&&ie.isPresenting===!0){const te=M.xr.getDepthSensingMesh();te!==null&&ha(te,N,-1/0,M.sortObjects)}ha(v,N,0,M.sortObjects),p.finish(),M.sortObjects===!0&&p.sort(le,de),Xe=ie.enabled===!1||ie.isPresenting===!1||ie.hasDepthSensing()===!1,Xe&&Se.addToRenderList(p,v),this.info.render.frame++,$e===!0&&re.beginShadows();const k=u.state.shadowsArray;Me.render(k,v,N),$e===!0&&re.endShadows(),this.info.autoReset===!0&&this.info.reset();const V=p.opaque,F=p.transmissive;if(u.setupLights(),N.isArrayCamera){const te=N.cameras;if(F.length>0)for(let ue=0,ge=te.length;ue<ge;ue++){const fe=te[ue];fl(V,F,v,fe)}Xe&&Se.render(v);for(let ue=0,ge=te.length;ue<ge;ue++){const fe=te[ue];dl(p,v,fe,fe.viewport)}}else F.length>0&&fl(V,F,v,N),Xe&&Se.render(v),dl(p,v,N);U!==null&&P===0&&(Be.updateMultisampleRenderTarget(U),Be.updateRenderTargetMipmap(U)),v.isScene===!0&&v.onAfterRender(M,v,N),ce.resetDefaultState(),y=-1,S=null,T.pop(),T.length>0?(u=T[T.length-1],$e===!0&&re.setGlobalState(M.clippingPlanes,u.state.camera)):u=null,E.pop(),E.length>0?p=E[E.length-1]:p=null};function ha(v,N,k,V){if(v.visible===!1)return;if(v.layers.test(N.layers)){if(v.isGroup)k=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(N);else if(v.isLight)u.pushLight(v),v.castShadow&&u.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||ht.intersectsSprite(v)){V&&De.setFromMatrixPosition(v.matrixWorld).applyMatrix4(Q);const ue=B.update(v),ge=v.material;ge.visible&&p.push(v,ue,ge,k,De.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||ht.intersectsObject(v))){const ue=B.update(v),ge=v.material;if(V&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),De.copy(v.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),De.copy(ue.boundingSphere.center)),De.applyMatrix4(v.matrixWorld).applyMatrix4(Q)),Array.isArray(ge)){const fe=ue.groups;for(let Re=0,Le=fe.length;Re<Le;Re++){const Ae=fe[Re],Ge=ge[Ae.materialIndex];Ge&&Ge.visible&&p.push(v,ue,Ge,k,De.z,Ae)}}else ge.visible&&p.push(v,ue,ge,k,De.z,null)}}const te=v.children;for(let ue=0,ge=te.length;ue<ge;ue++)ha(te[ue],N,k,V)}function dl(v,N,k,V){const F=v.opaque,te=v.transmissive,ue=v.transparent;u.setupLightsView(k),$e===!0&&re.setGlobalState(M.clippingPlanes,k),V&&xe.viewport(D.copy(V)),F.length>0&&hs(F,N,k),te.length>0&&hs(te,N,k),ue.length>0&&hs(ue,N,k),xe.buffers.depth.setTest(!0),xe.buffers.depth.setMask(!0),xe.buffers.color.setMask(!0),xe.setPolygonOffset(!1)}function fl(v,N,k,V){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;u.state.transmissionRenderTarget[V.id]===void 0&&(u.state.transmissionRenderTarget[V.id]=new mi(1,1,{generateMipmaps:!0,type:Ue.has("EXT_color_buffer_half_float")||Ue.has("EXT_color_buffer_float")?is:Fn,minFilter:Ii,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ke.workingColorSpace}));const te=u.state.transmissionRenderTarget[V.id],ue=V.viewport||D;te.setSize(ue.z*M.transmissionResolutionScale,ue.w*M.transmissionResolutionScale);const ge=M.getRenderTarget(),fe=M.getActiveCubeFace(),Re=M.getActiveMipmapLevel();M.setRenderTarget(te),M.getClearColor(K),q=M.getClearAlpha(),q<1&&M.setClearColor(16777215,.5),M.clear(),Xe&&Se.render(k);const Le=M.toneMapping;M.toneMapping=hi;const Ae=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),u.setupLightsView(V),$e===!0&&re.setGlobalState(M.clippingPlanes,V),hs(v,k,V),Be.updateMultisampleRenderTarget(te),Be.updateRenderTargetMipmap(te),Ue.has("WEBGL_multisampled_render_to_texture")===!1){let Ge=!1;for(let Qe=0,vt=N.length;Qe<vt;Qe++){const ut=N[Qe],st=ut.object,we=ut.geometry,gt=ut.material,Ye=ut.group;if(gt.side===gn&&st.layers.test(V.layers)){const Jt=gt.side;gt.side=Bt,gt.needsUpdate=!0,pl(st,k,V,we,gt,Ye),gt.side=Jt,gt.needsUpdate=!0,Ge=!0}}Ge===!0&&(Be.updateMultisampleRenderTarget(te),Be.updateRenderTargetMipmap(te))}M.setRenderTarget(ge,fe,Re),M.setClearColor(K,q),Ae!==void 0&&(V.viewport=Ae),M.toneMapping=Le}function hs(v,N,k){const V=N.isScene===!0?N.overrideMaterial:null;for(let F=0,te=v.length;F<te;F++){const ue=v[F],ge=ue.object,fe=ue.geometry,Re=ue.group;let Le=ue.material;Le.allowOverride===!0&&V!==null&&(Le=V),ge.layers.test(k.layers)&&pl(ge,N,k,fe,Le,Re)}}function pl(v,N,k,V,F,te){v.onBeforeRender(M,N,k,V,F,te),v.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),F.onBeforeRender(M,N,k,V,v,te),F.transparent===!0&&F.side===gn&&F.forceSinglePass===!1?(F.side=Bt,F.needsUpdate=!0,M.renderBufferDirect(k,N,V,F,v,te),F.side=pi,F.needsUpdate=!0,M.renderBufferDirect(k,N,V,F,v,te),F.side=gn):M.renderBufferDirect(k,N,V,F,v,te),v.onAfterRender(M,N,k,V,F,te)}function ds(v,N,k){N.isScene!==!0&&(N=Te);const V=ve.get(v),F=u.state.lights,te=u.state.shadowsArray,ue=F.state.version,ge=X.getParameters(v,F.state,te,N,k),fe=X.getProgramCacheKey(ge);let Re=V.programs;V.environment=v.isMeshStandardMaterial?N.environment:null,V.fog=N.fog,V.envMap=(v.isMeshStandardMaterial?Mt:Rt).get(v.envMap||V.environment),V.envMapRotation=V.environment!==null&&v.envMap===null?N.environmentRotation:v.envMapRotation,Re===void 0&&(v.addEventListener("dispose",$),Re=new Map,V.programs=Re);let Le=Re.get(fe);if(Le!==void 0){if(V.currentProgram===Le&&V.lightsStateVersion===ue)return gl(v,ge),Le}else ge.uniforms=X.getUniforms(v),v.onBeforeCompile(ge,M),Le=X.acquireProgram(ge,fe),Re.set(fe,Le),V.uniforms=ge.uniforms;const Ae=V.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Ae.clippingPlanes=re.uniform),gl(v,ge),V.needsLights=ku(v),V.lightsStateVersion=ue,V.needsLights&&(Ae.ambientLightColor.value=F.state.ambient,Ae.lightProbe.value=F.state.probe,Ae.directionalLights.value=F.state.directional,Ae.directionalLightShadows.value=F.state.directionalShadow,Ae.spotLights.value=F.state.spot,Ae.spotLightShadows.value=F.state.spotShadow,Ae.rectAreaLights.value=F.state.rectArea,Ae.ltc_1.value=F.state.rectAreaLTC1,Ae.ltc_2.value=F.state.rectAreaLTC2,Ae.pointLights.value=F.state.point,Ae.pointLightShadows.value=F.state.pointShadow,Ae.hemisphereLights.value=F.state.hemi,Ae.directionalShadowMap.value=F.state.directionalShadowMap,Ae.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Ae.spotShadowMap.value=F.state.spotShadowMap,Ae.spotLightMatrix.value=F.state.spotLightMatrix,Ae.spotLightMap.value=F.state.spotLightMap,Ae.pointShadowMap.value=F.state.pointShadowMap,Ae.pointShadowMatrix.value=F.state.pointShadowMatrix),V.currentProgram=Le,V.uniformsList=null,Le}function ml(v){if(v.uniformsList===null){const N=v.currentProgram.getUniforms();v.uniformsList=Ws.seqWithValue(N.seq,v.uniforms)}return v.uniformsList}function gl(v,N){const k=ve.get(v);k.outputColorSpace=N.outputColorSpace,k.batching=N.batching,k.batchingColor=N.batchingColor,k.instancing=N.instancing,k.instancingColor=N.instancingColor,k.instancingMorph=N.instancingMorph,k.skinning=N.skinning,k.morphTargets=N.morphTargets,k.morphNormals=N.morphNormals,k.morphColors=N.morphColors,k.morphTargetsCount=N.morphTargetsCount,k.numClippingPlanes=N.numClippingPlanes,k.numIntersection=N.numClipIntersection,k.vertexAlphas=N.vertexAlphas,k.vertexTangents=N.vertexTangents,k.toneMapping=N.toneMapping}function Bu(v,N,k,V,F){N.isScene!==!0&&(N=Te),Be.resetTextureUnits();const te=N.fog,ue=V.isMeshStandardMaterial?N.environment:null,ge=U===null?M.outputColorSpace:U.isXRRenderTarget===!0?U.texture.colorSpace:Mr,fe=(V.isMeshStandardMaterial?Mt:Rt).get(V.envMap||ue),Re=V.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Le=!!k.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ae=!!k.morphAttributes.position,Ge=!!k.morphAttributes.normal,Qe=!!k.morphAttributes.color;let vt=hi;V.toneMapped&&(U===null||U.isXRRenderTarget===!0)&&(vt=M.toneMapping);const ut=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,st=ut!==void 0?ut.length:0,we=ve.get(V),gt=u.state.lights;if($e===!0&&(j===!0||v!==S)){const kt=v===S&&V.id===y;re.setState(V,v,kt)}let Ye=!1;V.version===we.__version?(we.needsLights&&we.lightsStateVersion!==gt.state.version||we.outputColorSpace!==ge||F.isBatchedMesh&&we.batching===!1||!F.isBatchedMesh&&we.batching===!0||F.isBatchedMesh&&we.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&we.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&we.instancing===!1||!F.isInstancedMesh&&we.instancing===!0||F.isSkinnedMesh&&we.skinning===!1||!F.isSkinnedMesh&&we.skinning===!0||F.isInstancedMesh&&we.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&we.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&we.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&we.instancingMorph===!1&&F.morphTexture!==null||we.envMap!==fe||V.fog===!0&&we.fog!==te||we.numClippingPlanes!==void 0&&(we.numClippingPlanes!==re.numPlanes||we.numIntersection!==re.numIntersection)||we.vertexAlphas!==Re||we.vertexTangents!==Le||we.morphTargets!==Ae||we.morphNormals!==Ge||we.morphColors!==Qe||we.toneMapping!==vt||we.morphTargetsCount!==st)&&(Ye=!0):(Ye=!0,we.__version=V.version);let Jt=we.currentProgram;Ye===!0&&(Jt=ds(V,N,F));let $i=!1,Qt=!1,Cr=!1;const _t=Jt.getUniforms(),hn=we.uniforms;if(xe.useProgram(Jt.program)&&($i=!0,Qt=!0,Cr=!0),V.id!==y&&(y=V.id,Qt=!0),$i||S!==v){xe.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),_t.setValue(C,"projectionMatrix",v.projectionMatrix),_t.setValue(C,"viewMatrix",v.matrixWorldInverse);const qt=_t.map.cameraPosition;qt!==void 0&&qt.setValue(C,me.setFromMatrixPosition(v.matrixWorld)),Pe.logarithmicDepthBuffer&&_t.setValue(C,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&_t.setValue(C,"isOrthographic",v.isOrthographicCamera===!0),S!==v&&(S=v,Qt=!0,Cr=!0)}if(F.isSkinnedMesh){_t.setOptional(C,F,"bindMatrix"),_t.setOptional(C,F,"bindMatrixInverse");const kt=F.skeleton;kt&&(kt.boneTexture===null&&kt.computeBoneTexture(),_t.setValue(C,"boneTexture",kt.boneTexture,Be))}F.isBatchedMesh&&(_t.setOptional(C,F,"batchingTexture"),_t.setValue(C,"batchingTexture",F._matricesTexture,Be),_t.setOptional(C,F,"batchingIdTexture"),_t.setValue(C,"batchingIdTexture",F._indirectTexture,Be),_t.setOptional(C,F,"batchingColorTexture"),F._colorsTexture!==null&&_t.setValue(C,"batchingColorTexture",F._colorsTexture,Be));const dn=k.morphAttributes;if((dn.position!==void 0||dn.normal!==void 0||dn.color!==void 0)&&ne.update(F,k,Jt),(Qt||we.receiveShadow!==F.receiveShadow)&&(we.receiveShadow=F.receiveShadow,_t.setValue(C,"receiveShadow",F.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(hn.envMap.value=fe,hn.flipEnvMap.value=fe.isCubeTexture&&fe.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&N.environment!==null&&(hn.envMapIntensity.value=N.environmentIntensity),Qt&&(_t.setValue(C,"toneMappingExposure",M.toneMappingExposure),we.needsLights&&zu(hn,Cr),te&&V.fog===!0&&Z.refreshFogUniforms(hn,te),Z.refreshMaterialUniforms(hn,V,G,J,u.state.transmissionRenderTarget[v.id]),Ws.upload(C,ml(we),hn,Be)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Ws.upload(C,ml(we),hn,Be),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&_t.setValue(C,"center",F.center),_t.setValue(C,"modelViewMatrix",F.modelViewMatrix),_t.setValue(C,"normalMatrix",F.normalMatrix),_t.setValue(C,"modelMatrix",F.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){const kt=V.uniformsGroups;for(let qt=0,da=kt.length;qt<da;qt++){const Mi=kt[qt];Ne.update(Mi,Jt),Ne.bind(Mi,Jt)}}return Jt}function zu(v,N){v.ambientLightColor.needsUpdate=N,v.lightProbe.needsUpdate=N,v.directionalLights.needsUpdate=N,v.directionalLightShadows.needsUpdate=N,v.pointLights.needsUpdate=N,v.pointLightShadows.needsUpdate=N,v.spotLights.needsUpdate=N,v.spotLightShadows.needsUpdate=N,v.rectAreaLights.needsUpdate=N,v.hemisphereLights.needsUpdate=N}function ku(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return U},this.setRenderTargetTextures=function(v,N,k){const V=ve.get(v);V.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),ve.get(v.texture).__webglTexture=N,ve.get(v.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:k,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,N){const k=ve.get(v);k.__webglFramebuffer=N,k.__useDefaultFramebuffer=N===void 0};const Vu=C.createFramebuffer();this.setRenderTarget=function(v,N=0,k=0){U=v,A=N,P=k;let V=!0,F=null,te=!1,ue=!1;if(v){const fe=ve.get(v);if(fe.__useDefaultFramebuffer!==void 0)xe.bindFramebuffer(C.FRAMEBUFFER,null),V=!1;else if(fe.__webglFramebuffer===void 0)Be.setupRenderTarget(v);else if(fe.__hasExternalTextures)Be.rebindTextures(v,ve.get(v.texture).__webglTexture,ve.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const Ae=v.depthTexture;if(fe.__boundDepthTexture!==Ae){if(Ae!==null&&ve.has(Ae)&&(v.width!==Ae.image.width||v.height!==Ae.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Be.setupDepthRenderbuffer(v)}}const Re=v.texture;(Re.isData3DTexture||Re.isDataArrayTexture||Re.isCompressedArrayTexture)&&(ue=!0);const Le=ve.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Le[N])?F=Le[N][k]:F=Le[N],te=!0):v.samples>0&&Be.useMultisampledRTT(v)===!1?F=ve.get(v).__webglMultisampledFramebuffer:Array.isArray(Le)?F=Le[k]:F=Le,D.copy(v.viewport),O.copy(v.scissor),H=v.scissorTest}else D.copy(be).multiplyScalar(G).floor(),O.copy(He).multiplyScalar(G).floor(),H=ot;if(k!==0&&(F=Vu),xe.bindFramebuffer(C.FRAMEBUFFER,F)&&V&&xe.drawBuffers(v,F),xe.viewport(D),xe.scissor(O),xe.setScissorTest(H),te){const fe=ve.get(v.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+N,fe.__webglTexture,k)}else if(ue){const fe=N;for(let Re=0;Re<v.textures.length;Re++){const Le=ve.get(v.textures[Re]);C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0+Re,Le.__webglTexture,k,fe)}}else if(v!==null&&k!==0){const fe=ve.get(v.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,fe.__webglTexture,k)}y=-1},this.readRenderTargetPixels=function(v,N,k,V,F,te,ue,ge=0){if(!(v&&v.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let fe=ve.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ue!==void 0&&(fe=fe[ue]),fe){xe.bindFramebuffer(C.FRAMEBUFFER,fe);try{const Re=v.textures[ge],Le=Re.format,Ae=Re.type;if(!Pe.textureFormatReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Pe.textureTypeReadable(Ae)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=v.width-V&&k>=0&&k<=v.height-F&&(v.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+ge),C.readPixels(N,k,V,F,ye.convert(Le),ye.convert(Ae),te))}finally{const Re=U!==null?ve.get(U).__webglFramebuffer:null;xe.bindFramebuffer(C.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(v,N,k,V,F,te,ue,ge=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let fe=ve.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ue!==void 0&&(fe=fe[ue]),fe)if(N>=0&&N<=v.width-V&&k>=0&&k<=v.height-F){xe.bindFramebuffer(C.FRAMEBUFFER,fe);const Re=v.textures[ge],Le=Re.format,Ae=Re.type;if(!Pe.textureFormatReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Pe.textureTypeReadable(Ae))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ge=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,Ge),C.bufferData(C.PIXEL_PACK_BUFFER,te.byteLength,C.STREAM_READ),v.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+ge),C.readPixels(N,k,V,F,ye.convert(Le),ye.convert(Ae),0);const Qe=U!==null?ve.get(U).__webglFramebuffer:null;xe.bindFramebuffer(C.FRAMEBUFFER,Qe);const vt=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);return C.flush(),await qh(C,vt,4),C.bindBuffer(C.PIXEL_PACK_BUFFER,Ge),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,te),C.deleteBuffer(Ge),C.deleteSync(vt),te}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,N=null,k=0){const V=Math.pow(2,-k),F=Math.floor(v.image.width*V),te=Math.floor(v.image.height*V),ue=N!==null?N.x:0,ge=N!==null?N.y:0;Be.setTexture2D(v,0),C.copyTexSubImage2D(C.TEXTURE_2D,k,0,0,ue,ge,F,te),xe.unbindTexture()};const Hu=C.createFramebuffer(),Gu=C.createFramebuffer();this.copyTextureToTexture=function(v,N,k=null,V=null,F=0,te=null){te===null&&(F!==0?(Jr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),te=F,F=0):te=0);let ue,ge,fe,Re,Le,Ae,Ge,Qe,vt;const ut=v.isCompressedTexture?v.mipmaps[te]:v.image;if(k!==null)ue=k.max.x-k.min.x,ge=k.max.y-k.min.y,fe=k.isBox3?k.max.z-k.min.z:1,Re=k.min.x,Le=k.min.y,Ae=k.isBox3?k.min.z:0;else{const dn=Math.pow(2,-F);ue=Math.floor(ut.width*dn),ge=Math.floor(ut.height*dn),v.isDataArrayTexture?fe=ut.depth:v.isData3DTexture?fe=Math.floor(ut.depth*dn):fe=1,Re=0,Le=0,Ae=0}V!==null?(Ge=V.x,Qe=V.y,vt=V.z):(Ge=0,Qe=0,vt=0);const st=ye.convert(N.format),we=ye.convert(N.type);let gt;N.isData3DTexture?(Be.setTexture3D(N,0),gt=C.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(Be.setTexture2DArray(N,0),gt=C.TEXTURE_2D_ARRAY):(Be.setTexture2D(N,0),gt=C.TEXTURE_2D),C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,N.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,N.unpackAlignment);const Ye=C.getParameter(C.UNPACK_ROW_LENGTH),Jt=C.getParameter(C.UNPACK_IMAGE_HEIGHT),$i=C.getParameter(C.UNPACK_SKIP_PIXELS),Qt=C.getParameter(C.UNPACK_SKIP_ROWS),Cr=C.getParameter(C.UNPACK_SKIP_IMAGES);C.pixelStorei(C.UNPACK_ROW_LENGTH,ut.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,ut.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,Re),C.pixelStorei(C.UNPACK_SKIP_ROWS,Le),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Ae);const _t=v.isDataArrayTexture||v.isData3DTexture,hn=N.isDataArrayTexture||N.isData3DTexture;if(v.isDepthTexture){const dn=ve.get(v),kt=ve.get(N),qt=ve.get(dn.__renderTarget),da=ve.get(kt.__renderTarget);xe.bindFramebuffer(C.READ_FRAMEBUFFER,qt.__webglFramebuffer),xe.bindFramebuffer(C.DRAW_FRAMEBUFFER,da.__webglFramebuffer);for(let Mi=0;Mi<fe;Mi++)_t&&(C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,ve.get(v).__webglTexture,F,Ae+Mi),C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,ve.get(N).__webglTexture,te,vt+Mi)),C.blitFramebuffer(Re,Le,ue,ge,Ge,Qe,ue,ge,C.DEPTH_BUFFER_BIT,C.NEAREST);xe.bindFramebuffer(C.READ_FRAMEBUFFER,null),xe.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else if(F!==0||v.isRenderTargetTexture||ve.has(v)){const dn=ve.get(v),kt=ve.get(N);xe.bindFramebuffer(C.READ_FRAMEBUFFER,Hu),xe.bindFramebuffer(C.DRAW_FRAMEBUFFER,Gu);for(let qt=0;qt<fe;qt++)_t?C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,dn.__webglTexture,F,Ae+qt):C.framebufferTexture2D(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,dn.__webglTexture,F),hn?C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,kt.__webglTexture,te,vt+qt):C.framebufferTexture2D(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,kt.__webglTexture,te),F!==0?C.blitFramebuffer(Re,Le,ue,ge,Ge,Qe,ue,ge,C.COLOR_BUFFER_BIT,C.NEAREST):hn?C.copyTexSubImage3D(gt,te,Ge,Qe,vt+qt,Re,Le,ue,ge):C.copyTexSubImage2D(gt,te,Ge,Qe,Re,Le,ue,ge);xe.bindFramebuffer(C.READ_FRAMEBUFFER,null),xe.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else hn?v.isDataTexture||v.isData3DTexture?C.texSubImage3D(gt,te,Ge,Qe,vt,ue,ge,fe,st,we,ut.data):N.isCompressedArrayTexture?C.compressedTexSubImage3D(gt,te,Ge,Qe,vt,ue,ge,fe,st,ut.data):C.texSubImage3D(gt,te,Ge,Qe,vt,ue,ge,fe,st,we,ut):v.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,te,Ge,Qe,ue,ge,st,we,ut.data):v.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,te,Ge,Qe,ut.width,ut.height,st,ut.data):C.texSubImage2D(C.TEXTURE_2D,te,Ge,Qe,ue,ge,st,we,ut);C.pixelStorei(C.UNPACK_ROW_LENGTH,Ye),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,Jt),C.pixelStorei(C.UNPACK_SKIP_PIXELS,$i),C.pixelStorei(C.UNPACK_SKIP_ROWS,Qt),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Cr),te===0&&N.generateMipmaps&&C.generateMipmap(gt),xe.unbindTexture()},this.initRenderTarget=function(v){ve.get(v).__webglFramebuffer===void 0&&Be.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?Be.setTextureCube(v,0):v.isData3DTexture?Be.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?Be.setTexture2DArray(v,0):Be.setTexture2D(v,0),xe.unbindTexture()},this.resetState=function(){A=0,P=0,U=null,xe.reset(),ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Nn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ke._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ke._getUnpackColorSpace()}}const x0={subtle:{intensity:.35,style:"radial",duration:2},strong:{intensity:.75,style:"silhouette",duration:3},cinematic:{intensity:1,style:"alternating",duration:6}},wc={radial:1,invert:2,silhouette:3,alternating:4},v0=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,M0=`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform int uMode;        // 0 off, 1 radial, 2 invert, 3 silhouette, 4 alternating
  uniform float uIntensity; // 0..1
  uniform float uProgress;  // 0..1 across the effect
  uniform vec2 uCenter;     // impact point in UV
  uniform float uAngle;     // preferred burst direction (radians, UV space)
  uniform float uSeed;
  uniform float uAspect;

  float hash(float n) { return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }

  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  // Hard two/three-tone monochrome of the scene: the "silhouette" look.
  vec3 monoHard(vec3 c, float jag) {
    float l = lum(c) + jag;
    float v = l > 0.62 ? 1.0 : (l > 0.34 ? 0.55 : 0.0);
    return vec3(v);
  }

  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    if (uMode == 0 || uIntensity <= 0.001) {
      gl_FragColor = base;
      #include <colorspace_fragment>
      return;
    }

    vec2 p = vUv - uCenter;
    p.x *= uAspect;
    float r = length(p);
    float ang = atan(p.y, p.x);

    int mode = uMode;
    float localProgress = uProgress;
    if (mode == 4) { // alternating: black burst -> inversion -> white burst
      float phase = floor(uProgress * 3.0);
      mode = phase < 0.5 ? 5 : (phase < 1.5 ? 2 : 6);
      localProgress = fract(uProgress * 3.0);
    }
    float fade = 1.0 - localProgress; // effect is strongest on its first frame

    vec3 col = base.rgb;

    if (mode == 2) {
      // --- B/W inversion: inverted, hard-posterised monochrome ---
      float jag = (hash(floor(vUv.y * 90.0)) - 0.5) * 0.06;
      vec3 inv = monoHard(vec3(1.0) - base.rgb, jag);
      col = mix(col, inv, clamp(0.35 + uIntensity * 0.65, 0.0, 1.0));
    } else if (mode == 3) {
      // --- High-contrast silhouette: scene crushed to black/white ---
      vec2 dirv = vec2(cos(uAngle), sin(uAngle));
      float bands = hash(floor(dot(vUv, dirv) * 26.0)) - 0.5;
      float jag = bands * 0.22 + (hash(floor(ang * 9.0)) - 0.5) * 0.08;
      vec3 sil = monoHard(base.rgb, jag * uIntensity);
      col = mix(col, sil, clamp(0.45 + uIntensity * 0.55, 0.0, 1.0));
    }

    // Alternating extremes: crush the frame to near-black / near-white first,
    // then let the burst carve through it (like the reference's cut frames).
    if (mode == 5) col = vec3(0.02);
    if (mode == 6) col = vec3(0.98);

    if (mode == 1 || mode == 3 || mode == 5 || mode == 6) {
      // --- Radial burst: clustered speed-lines, giant jagged shards, huge core ---
      // (Skala mengikuti video referensi: bentuk menutupi 30-60% layar.)
      float lines = mode == 1 ? 56.0 : 36.0;
      float seg = floor((ang + 3.14159265) / 6.2831853 * lines);
      float segHash = hash(seg * 3.7);
      float dirBoost = 1.0 + 0.8 * max(0.0, cos(ang - uAngle));
      float lineLen = (0.35 + segHash * 1.5) * (0.4 + uIntensity * 1.1) * dirBoost;
      float angFrac = fract((ang + 3.14159265) / 6.2831853 * lines);
      float lineWidth = 0.16 + 0.22 * hash(seg * 9.1);
      float lineMask = step(abs(angFrac - 0.5), lineWidth)
        * step(0.04 + 0.08 * hash(seg * 5.3), r)
        * step(r, lineLen)
        * step(segHash, 0.2 + uIntensity * 0.8); // density follows intensity
      vec3 lineCol = segHash > 0.4 ? vec3(1.0) : vec3(0.0);
      if (mode == 5) lineCol = vec3(1.0);       // alternating p1: white on black
      if (mode == 6) lineCol = vec3(0.0);       // alternating p3: black on white
      col = mix(col, lineCol, lineMask * clamp(0.6 + 0.4 * fade + uIntensity * 0.35, 0.0, 1.0));

      // Giant jagged shards: segitiga-cakar lebar yang meledak dari titik tumbuk.
      float shardCount = 9.0;
      float shardSeg = floor((ang + 3.14159265) / 6.2831853 * shardCount);
      float shardHash = hash(shardSeg * 13.7);
      float shardFrac = fract((ang + 3.14159265) / 6.2831853 * shardCount);
      float shardLen = (0.45 + shardHash * 1.15) * (0.35 + uIntensity * 0.95) * dirBoost;
      float shardWidth = 0.16 + shardHash * 0.42;
      float shardMask = step(shardFrac, shardWidth)
        * step(0.03, r) * step(r, shardLen)
        * step(shardHash, 0.15 + uIntensity * 0.85)
        * step(0.35, uIntensity + (mode == 3 || mode == 5 || mode == 6 ? 0.35 : 0.0));
      vec3 shardCol = mode == 6 ? vec3(0.0) : vec3(1.0);
      if (mode == 3 && shardHash > 0.62) shardCol = vec3(0.0);
      col = mix(col, shardCol, shardMask * 0.96);

      // Jagged star core around the impact point (irregular, never a circle).
      float starSeg = floor((ang + 3.14159265) / 6.2831853 * 14.0);
      float starR = (0.10 + hash(starSeg * 7.3) * 0.30) * (0.55 + uIntensity * 0.95) * (0.65 + 0.35 * fade);
      float starMask = step(r, starR);
      vec3 starCol = mode == 6 ? vec3(0.0) : vec3(1.0);
      if (mode == 3 && hash(starSeg * 3.1) > 0.5) starCol = vec3(0.0);
      col = mix(col, starCol, starMask * 0.95);
    }

    gl_FragColor = vec4(col, base.a);
    #include <colorspace_fragment>
  }
`;function S0(i){const e={enabled:!0,reducedFlash:!1,intensityScale:1},t=new Oe;i.getSize(t);const n=i.getPixelRatio(),r=new mi(t.x*n,t.y*n,{samples:i.capabilities.isWebGL2&&!navigator.maxTouchPoints?4:0,depthBuffer:!0}),s={tDiffuse:{value:r.texture},uMode:{value:0},uIntensity:{value:0},uProgress:{value:0},uCenter:{value:new Oe(.5,.5)},uAngle:{value:0},uSeed:{value:0},uAspect:{value:t.x/Math.max(1,t.y)}},a=new On({vertexShader:v0,fragmentShader:M0,uniforms:s,depthTest:!1,depthWrite:!1}),o=new nu,c=new rl(-1,1,1,-1,0,1);o.add(new Et(new Yi(2,2),a));const l=new L,h=new L;let d=null,f=null;function m(E,T){return E?E.isVector3&&T?(l.copy(E).project(T),l.z>1?{x:.5,y:.5}:{x:l.x*.5+.5,y:l.y*.5+.5}):typeof E.x=="number"&&typeof E.y=="number"?{x:on.clamp(E.x,0,1),y:on.clamp(E.y,0,1)}:{x:.5,y:.5}:{x:.5,y:.5}}function _(E,T,M){return typeof E=="number"?E:E?.isVector3&&T?.isVector3&&M?(l.copy(T).project(M),h.copy(T).add(E).project(M),Math.atan2(h.y-l.y,h.x-l.x)):-Math.PI/2}function x(E={},T=f){if(!e.enabled)return!1;let M=on.clamp((E.intensity??.7)*e.intensityScale,0,1),R=E.style||"radial";e.reducedFlash&&(M=Math.min(M,.4),(R==="alternating"||R==="invert")&&(R="radial")),wc[R]||(R="radial");let A;Number.isFinite(E.duration)?A=Math.round(E.duration):Number.isFinite(E.durationMs)?A=Math.round(E.durationMs/16.7):A=R==="alternating"?6:M>.8?3:2,A=on.clamp(A,1,12);const P=m(E.position,T);return s.uCenter.value.set(P.x,P.y),s.uAngle.value=_(E.direction,E.position,T),s.uSeed.value=Math.random()*100,s.uIntensity.value=M,s.uProgress.value=0,s.uMode.value=wc[R],d={totalFrames:A,elapsed:0,intensity:M},!0}function p(E,T,M=i.getPixelRatio()){!E||!T||(r.setSize(Math.round(E*M),Math.round(T*M)),s.uAspect.value=E/T)}function u(E,T){f=T,i.setRenderTarget(r),i.render(E,T),i.setRenderTarget(null),d&&(d.elapsed+=1,s.uProgress.value=d.elapsed/d.totalFrames,d.elapsed>=d.totalFrames&&(d=null,s.uMode.value=0,s.uIntensity.value=0)),i.render(o,c)}return{trigger:x,render:u,setSize:p,settings:e,presets:x0}}const ae=i=>document.querySelector(i),_i=i=>[...document.querySelectorAll(i)],zt=matchMedia("(pointer: coarse)").matches||navigator.maxTouchPoints>0,Bi=ae("#scene"),Qr=ae("#app"),Zt=new _0({canvas:Bi,antialias:!zt,powerPreference:"high-performance"});Zt.setPixelRatio(Math.min(devicePixelRatio,zt?1.35:1.8));Zt.setSize(innerWidth,innerHeight);Zt.shadowMap.enabled=!0;Zt.shadowMap.type=Nc;Zt.outputColorSpace=nn;Zt.toneMapping=Oc;Zt.toneMappingExposure=1.05;const ke=new nu;ke.background=new Ve(9555673);ke.fog=new Jo(9555673,22,67);const St=new rn(68,innerWidth/innerHeight,.08,110);St.rotation.order="YXZ";ke.add(St);const es=S0(Zt);function aa(i){return es.trigger(i,St)}window.triggerImpactFrame=aa;window.impactFrameSettings=es.settings;const y0=new Dd;new Id;new Oe(0,0);const sn=new L,li=new L,pn=new Tt,Cn={grass:7842156,grassDark:5669723,wheat:14268257,wood:6111797,plaster:15391918,roof:4546149,ink:2175802,gold:16041562,spirit:15691624};function tt(i,e={}){return new Td({color:i,...e})}const it={ground:tt(Cn.grass),grassDark:tt(Cn.grassDark),path:tt(12162923),plaster:tt(Cn.plaster),wood:tt(Cn.wood),roof:tt(Cn.roof),leaf:tt(5147490),leafLight:tt(7384428),rock:tt(6583673),dark:tt(Cn.ink),wheat:tt(Cn.wheat),gold:tt(Cn.gold,{emissive:7162640,emissiveIntensity:.4})};function je(i,e,{x:t=0,y:n=0,z:r=0,rx:s=0,ry:a=0,rz:o=0,scale:c=1,shadow:l=!0}={}){const h=new Et(i,e);return h.position.set(t,n,r),h.rotation.set(s,a,o),h.scale.setScalar(c),h.castShadow=l,h.receiveShadow=l,h}function Lt(i,e,t={},n=1.035){const r=je(i,e,t),s=new Et(i,new un({color:Cn.ink,side:Bt}));return s.scale.setScalar(n),s.castShadow=!1,r.add(s),r}const E0=new wd(14285823,4871487,2.15);ke.add(E0);const wn=new Pd(16771248,3.1);wn.position.set(-18,27,12);wn.castShadow=!0;wn.shadow.mapSize.set(zt?1024:1536,zt?1024:1536);wn.shadow.camera.left=-30;wn.shadow.camera.right=30;wn.shadow.camera.top=30;wn.shadow.camera.bottom=-30;wn.shadow.camera.near=2;wn.shadow.camera.far=70;wn.shadow.bias=-4e-4;ke.add(wn);const $t=new It;ke.add($t);const wr=[],fu=[],al={topColor:{value:new Ve(6271695)},horizonColor:{value:new Ve(14282441)}},T0=new Et(new Kn(92,24,14),new On({side:Bt,depthWrite:!1,fog:!1,uniforms:al,vertexShader:"varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:"uniform vec3 topColor; uniform vec3 horizonColor; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y * 1.6 + 0.12, 0.0, 1.0); gl_FragColor = vec4(mix(horizonColor, topColor, pow(h, 0.75)), 1.0); }"}));ke.add(T0);const pu=je(new Oi(3.4,24),new un({color:16773294,fog:!1}),{x:-34,y:30,z:-58,shadow:!1});pu.lookAt(0,4,0);ke.add(pu);const mu=je(new Oi(7.5,24),new un({color:16771496,transparent:!0,opacity:.28,fog:!1,depthWrite:!1}),{x:-34,y:30,z:-58.5,shadow:!1});mu.lookAt(0,4,0);ke.add(mu);function b0(){const i=je(new Yi(92,92),it.ground,{rx:-Math.PI/2,shadow:!1});i.receiveShadow=!0,$t.add(i);const e=new Oi(1,20);for(let s=0;s<26;s++){const a=je(e,s%3?it.grassDark:tt(8959864),{x:qe(s*9.7,-36,36),y:.006,z:qe(s*3.1,-36,36),rx:-Math.PI/2,scale:qe(s*1.9,1.2,4.2),shadow:!1});a.material.transparent=!0,a.material.opacity=.32,$t.add(a)}for(let s=0;s<15;s++){const a=16-s*2.25,o=je(new Oi(1,18),it.path,{x:Math.sin(s*.55)*1.05,y:.012,z:a,rx:-Math.PI/2,scale:1.25+s%3*.13,shadow:!1});$t.add(o)}Br(-8,8,.18,5992052),Br(8.5,11,-.18,8213840),Br(-14,16,.4,5204592,.86),Br(15,18,-.32,7558992,.9),Br(14,2.5,-.58,5400939,.75),wi(-15,3,1.1),wi(16,-6,1.25),wi(-18,-8,1.4),wi(19,10,1.15),wi(-11,20,1.25),wi(10,23,1.05);for(let s=0;s<11;s++)wi(qe(s*4.1,-32,32),qe(s*8.2,-32,-21),qe(s*7.3,.8,1.35));C0(-5.2,-3.5),P0(),L0(),D0(),A0(),w0(),R0();const t=new It,n=Lt(new Kt(1.2,1.65,.42),it.rock,{y:.82},1.025);n.rotation.z=-.04,t.add(n);const r=je(new ss(.25,.035,8,20),it.gold,{y:1.03,z:.24,rx:Math.PI/2});t.add(r),t.position.set(0,0,-17.5),$t.add(t),wr.push({x:0,z:-17.5,r:1})}function A0(){const i=new Kt(.14,.85,.14),e=new Kt(.09,.11,2.1);for(let n of[-1,1])for(let r=0;r<6;r++){const s=12-r*3.4,a=n*(2.3+Math.sin(r*.8)*.25);$t.add(je(i,it.wood,{x:a,y:.42,z:s,ry:qe(r*n,-.12,.12)}),je(e,it.wood,{x:a,y:.58,z:s-1.05,rx:.02}))}[16030401,16774134,16765543].forEach((n,r)=>{const s=new iu(new $n(.09,0),tt(n,{emissive:n,emissiveIntensity:.25}),26);s.castShadow=!1;for(let a=0;a<26;a++)pn.position.set(qe(a*7.3+r*31,-24,24),.16,qe(a*3.9+r*17,-22,24)),Math.abs(pn.position.x)<2&&(pn.position.x+=3.4),pn.rotation.set(0,qe(a,0,3),0),pn.scale.setScalar(qe(a*1.7+r,.7,1.5)),pn.updateMatrix(),s.setMatrixAt(a,pn.matrix);s.instanceMatrix.needsUpdate=!0,$t.add(s)});for(let n=0;n<9;n++){const r=Lt(new tl(qe(n*2.2,.25,.65),0),it.rock,{x:qe(n*11.1,-26,26),y:.18,z:qe(n*5.7,-24,25),ry:qe(n,0,3)},1.02);Math.abs(r.position.x)<2.4&&(r.position.x+=5),$t.add(r)}const t=tt(16761722,{emissive:16751164,emissiveIntensity:1.6});[[-3.4,6],[3.6,-1],[-4.2,-6.5]].forEach(([n,r])=>{const s=new It;s.add(je(new jt(.07,.09,2.3,6),it.wood,{y:1.15})),s.add(je(new Kt(.42,.42,.42),t,{y:2.42,shadow:!1})),s.add(je(new _n(.42,.3,4),it.dark,{y:2.78,ry:Math.PI/4}));const a=new ra(16757854,5,9,1.8);a.position.y=2.42,s.add(a),s.position.set(n,0,r),$t.add(s)})}let Gr=null;function w0(){const i=zt?90:170,e=new Float32Array(i*3);for(let n=0;n<i;n++)e[n*3]=qe(n*13.7,-30,30),e[n*3+1]=qe(n*7.1,.3,7.5),e[n*3+2]=qe(n*3.3,-28,26);const t=new wt;t.setAttribute("position",new Xt(e,3)),Gr=new el(t,new na({color:16773286,size:.085,transparent:!0,opacity:.65,depthWrite:!1})),ke.add(Gr)}const gu=[];function R0(){const i=new un({color:2901840,side:gn});for(let e=0;e<4;e++){const t=new It,n=a=>{const o=new Yi(.85,.22);o.translate(a*.42,0,0);const c=new Et(o,i);return c.castShadow=!1,c},r=n(-1),s=n(1);t.add(r,s),t.position.set(-38+e*9,16.5+e%3*1.8,-14-e*4),t.userData={speed:1.1+e*.16,phase:e*1.7,left:r,right:s},ke.add(t),gu.push(t)}}function Br(i,e,t=0,n=5465963,r=1){const s=new It,a=Lt(new Kt(4.4,2.9,3.5),it.plaster,{y:1.45},1.012);s.add(a),[[-1.72,1.45,1.78,.13,2.8,.12],[1.72,1.45,1.78,.13,2.8,.12],[0,2.45,1.79,3.5,.12,.1],[0,.48,1.79,3.5,.12,.1]].forEach(([f,m,_,x,p,u])=>{const E=je(new Kt(x,p,u),it.wood,{x:f,y:m,z:_});s.add(E)});const c=Lt(new _n(3.25,2,4),tt(n),{y:3.85,ry:Math.PI/4},1.018);c.scale.z=.82,s.add(c);const l=je(new Kt(.95,1.7,.15),it.wood,{y:.86,z:1.82});s.add(l);const h=tt(10213836,{emissive:3233359,emissiveIntensity:.5}),d=je(new Kt(.82,.72,.13),h,{x:1.35,y:1.62,z:1.84});s.add(d),s.position.set(i,0,e),s.rotation.y=t,s.scale.setScalar(r),$t.add(s),wr.push({x:i,z:e,r:2.25*r})}function wi(i,e,t=1){const n=new It,r=Lt(new jt(.28,.43,3.1,7),it.wood,{y:1.55},1.04);n.add(r);const s=Lt(new $n(1.65,1),it.leaf,{y:3.5,x:-.25},1.025),a=Lt(new $n(1.35,1),it.leafLight,{y:4.2,x:.48},1.025);n.add(s,a),fu.push({obj:s,phase:i*1.7+e,amp:.035},{obj:a,phase:i-e*1.3,amp:.05}),n.position.set(i,0,e),n.scale.setScalar(t),$t.add(n),wr.push({x:i,z:e,r:1.15*t})}let Yt;function C0(i,e){Yt=new It;const t=Lt(new jt(.16,.2,3.4,7),it.wood,{x:-1.05,y:1.7},1.04),n=Lt(new jt(.16,.2,3.4,7),it.wood,{x:1.05,y:1.7},1.04),r=Lt(new jt(.17,.17,2.45,7),it.wood,{y:3.23,rz:Math.PI/2},1.04),s=Lt(new _n(.47,.8,12,1,!0),it.gold,{y:2.62,rx:Math.PI},1.035),a=je(new Kn(.11,8,6),it.dark,{y:2.2});Yt.add(t,n,r,s,a),Yt.userData.body=s,Yt.position.set(i,0,e),$t.add(Yt),wr.push({x:i,z:e,r:1.05})}function P0(){const i=new _n(.055,.62,4);i.translate(0,.31,0);const e=new iu(i,it.wheat,260);e.castShadow=!1,e.receiveShadow=!0;let t=0;for(let n=0;n<340&&t<260;n++){const r=qe(n*15.11,-13,13),s=qe(n*4.83,-20,-7);if(Math.abs(r)<1.7||r*r+(s+13.3)*(s+13.3)<7)continue;pn.position.set(r,0,s),pn.rotation.y=qe(n,0,Math.PI);const a=qe(n*2.4,.75,1.25);pn.scale.set(a,a,a),pn.updateMatrix(),e.setMatrixAt(t++,pn.matrix)}e.count=t,e.instanceMatrix.needsUpdate=!0,$t.add(e)}function L0(){const i=tt(7572619),e=tt(8493466);for(let t=0;t<12;t++){const n=t/12*Math.PI*2,r=49+t%3*4,s=8+t%4*2.8,a=je(new _n(6.5,s,5),t%2?i:e,{x:Math.cos(n)*r,y:s/2-1,z:Math.sin(n)*r,ry:n,shadow:!1});$t.add(a)}}function D0(){const i=tt(15399151,{transparent:!0,opacity:.72});for(let e=0;e<7;e++){const t=new It;for(let n=0;n<4;n++){const r=je(new $n(1+n*.13,1),i,{x:n*1.25,y:Math.sin(n)*.25,scale:1+n%2*.18,shadow:!1});t.add(r)}t.position.set(-28+e*11,15+e%3*2.2,-25+e%2*18),t.userData.speed=.25+e*.025,ke.add(t),_u.push(t)}}function qe(i,e,t){const n=Math.sin(i*91.3458+17.123)*43758.5453;return e+(n-Math.floor(n))*(t-e)}const _u=[];b0();const w={group:new It,head:null,eye:null,aura:null,anchor:new L(0,0,-13.2),active:!1,revealed:!1,resolved:!1,stunnedUntil:0,bellRecentUntil:0,rushRecentUntil:0,rushing:!1,rushEnd:0,enragedUntil:0,attackTimer:2.1,hp:120,maxHp:120,kbVel:null,kbY:0,kbVy:0,kbActive:!1,kbWallHitDone:!1,kbStaggerUntil:0,reactUntil:0,reactPower:0,lastPos:null};function I0(){const i=w.group,e=tt(12950351),t=tt(9259590),n=tt(15127976),r=Lt(new jt(.11,.15,3.6,7),it.wood,{y:1.8},1.05),s=Lt(new jt(.1,.12,3.1,7),it.wood,{y:2.65,rz:Math.PI/2},1.05),a=Lt(new _n(.72,1.3,7),t,{y:2.5,rx:Math.PI},1.035);a.scale.z=.58;const o=Lt(new Kn(.48,12,8),n,{y:3.42},1.045);o.scale.z=.72;const c=Lt(new jt(.9,.9,.1,12),it.dark,{y:3.78,rz:-.08},1.025);c.scale.z=.62;const l=Lt(new _n(.52,.9,9),it.dark,{y:4.15,rz:-.15},1.025),h=tt(16739679,{emissive:16722459,emissiveIntensity:1.7}),d=je(new Kn(.075,8,6),h,{x:.16,y:3.47,z:.4,shadow:!1}),f=je(new Kn(.055,8,6),h,{x:-.17,y:3.47,z:.4,shadow:!1}),m=je(new _n(.23,.8,6),e,{x:-1.55,y:2.65,rz:-Math.PI/2}),_=je(new _n(.23,.8,6),e,{x:1.55,y:2.65,rz:Math.PI/2}),x=new un({color:Cn.spirit,transparent:!0,opacity:.33,side:gn,depthWrite:!1}),p=je(new ss(1.25,.035,8,48),x,{y:.16,rx:Math.PI/2,shadow:!1}),u=new It;for(let E=0;E<6;E++){const T=je(new jt(.018,.018,1.4+E*.14,5),tt(14176334,{emissive:9246744,emissiveIntensity:.8}),{x:Math.cos(E/6*Math.PI*2)*.7,y:.85,z:Math.sin(E/6*Math.PI*2)*.7,rz:Math.sin(E)*.3,shadow:!1});u.add(T)}i.add(r,s,a,o,c,l,d,f,m,_,p,u),i.position.copy(w.anchor),i.scale.setScalar(.92),w.head=o,w.eye=d,w.aura=p,w.threads=u,ke.add(i)}I0();w.kbVel=new L;const Ui=new It;{const i=new un({color:12578815,transparent:!0,opacity:.32,depthWrite:!1}),e=new Et(new _n(.72,1.6,7),i);e.position.y=2.4,e.rotation.x=Math.PI;const t=new Et(new Kn(.48,10,8),i);t.position.y=3.4,Ui.add(e,t),Ui.visible=!1,ke.add(Ui)}const xu=14,Xn=new Float32Array(xu*2*3),ol=new wt;ol.setAttribute("position",new Xt(Xn,3));const oa=new Ed(ol,new ru({color:16757145,transparent:!0,opacity:.75}));oa.visible=!1;oa.frustumCulled=!1;ke.add(oa);const ai=[],Sn=new It,qn={};function U0(){const i=je(new jt(.075,.095,.34,7),tt(3495531,{emissive:859174,emissiveIntensity:.4}),{rx:1.15,rz:-.35,shadow:!1});i.position.set(.02,-.1,.1);const e=je(new Kn(.075,10,8),tt(14262379),{shadow:!1});e.scale.set(.85,.65,1.15),e.position.set(.1,.02,-.05);const t=je(new ss(.11,.016,8,24),it.gold,{shadow:!1});t.position.set(.13,.07,-.14),t.rotation.set(.4,.25,0);const n=je(new $n(.045,0),tt(9296850,{emissive:3129262,emissiveIntensity:1.8}),{shadow:!1});n.position.copy(t.position);const r=new ra(9296850,.7,1.4,2);r.position.copy(t.position);const s=je(new jt(.008,.008,.22,5),it.dark,{shadow:!1});s.position.set(.12,-.03,-.12),s.rotation.z=.5,Sn.add(i,e,t,n,r,s),Sn.position.set(.37,-.36,-.58),Sn.scale.setScalar(.78),Sn.rotation.set(.15,-.22,.06),St.add(Sn),Object.assign(qn,{ring:t,gem:n,gemLight:r,basePos:Sn.position.clone()})}U0();const Dn=[],Ni=[],Xs=[];function N0(i){const e=new un({color:16736857}),t=je(new $n(.17,0),e,{shadow:!1});t.position.copy(w.group.position).add(new L(0,2.4,0));const r=z.position.clone().sub(t.position).normalize().multiplyScalar(6.9),s=new ra(16732489,1.7,3.5);t.add(s),ke.add(t),Dn.push({mesh:t,velocity:r,born:i,life:4}),mt(155,.12,"sawtooth",.035)}function Bo(i,e,t=1){const n=e.clone(),r=Math.round(16+t*10),s=new Float32Array(r*3),a=[];for(let d=0;d<r;d++){s[d*3]=i.x,s[d*3+1]=i.y,s[d*3+2]=i.z;const f=new L(qe(d*3.1,-1,1),qe(d*5.7,.2,1.5),qe(d*7.9,-1,1)).normalize().multiplyScalar(qe(d*9.3,1,2.6+t));f.addScaledVector(n,1.6+t*.5),a.push(f)}const o=new wt;o.setAttribute("position",new Xt(s,3));const c=new na({color:3485738,size:.21,transparent:!0,opacity:1,depthWrite:!1}),l=new el(o,c);ke.add(l),Ni.push({points:l,velocities:a,age:0,gravity:5.5,life:1.1}),An(i,14209732,Math.round(10+t*5),1.5+t*.4);const h=Ni[Ni.length-1];h&&(h.gravity=.4,h.points.material.size=.3,h.points.material.opacity=.55,h.life=.9,h.baseOpacity=.55)}function Rc(i,e=.6,t=4){const n=new un({color:2893344,transparent:!0,opacity:.55,depthWrite:!1}),r=new Et(new Oi(e,14),n);r.rotation.x=-Math.PI/2,r.position.set(i.x,.02+Math.random()*.01,i.z),r.scale.set(1.4,.8,1),r.rotation.z=Math.random()*Math.PI,ke.add(r),Xr.push({group:r,mat:n,age:0,life:t,grow:.06,baseOpacity:.55})}function An(i,e=16765543,t=20,n=1.6){const r=new Float32Array(t*3),s=[];for(let l=0;l<t;l++)r[l*3]=i.x,r[l*3+1]=i.y,r[l*3+2]=i.z,s.push(new L(qe(l*2.1+performance.now(),-1,1),qe(l*4.3,-.1,1.4),qe(l*6.7,-1,1)).normalize().multiplyScalar(qe(l*8.1,.5,n)));const a=new wt;a.setAttribute("position",new Xt(r,3));const o=new na({color:e,size:.12,transparent:!0,opacity:1,depthWrite:!1}),c=new el(a,o);ke.add(c),Ni.push({points:c,velocities:s,age:0,gravity:.65})}function zi(i,e=16765543,t=8){const n=new un({color:e,transparent:!0,opacity:.75,side:gn,depthWrite:!1}),r=je(new nl(.92,1,64),n,{x:i.x,y:.08,z:i.z,rx:-Math.PI/2,shadow:!1});ke.add(r),Xs.push({mesh:r,age:0,maxScale:t})}const z={position:new L(0,1.68,13),yaw:0,pitch:-.05,clarity:100,mana:60,maxMana:60,pdCharges:3,pdReadyAt:0,stamina:100,sprintExhausted:!1,sprinting:!1,bobPhase:0,roll:0,fovKick:0,stepDistance:0,invulnerableUntil:0,dodgeVelocity:new L,lastMove:new L,testMode:null,testStartDistance:0,retreatDeadline:0,saveTimer:0};let yr=!1,la=!1,Wr=null;const ci=new Set,ln={id:null,x:0,y:0};let ki=null,qs={x:0,y:0},Je="menu",ct=!1,F0=!1,Cc=0,yn=null,Pc=null;const pt={formula:0,mechanism:0,identity:0},vu=i=>i>=100?"Terverifikasi":i>=75?"Analisis Mendalam":i>=40?"Analisis":i>0?"Observasi":"Belum direkam",Zn=new Set,Vi=[null,null,null,null];let gi=0;const Lc={};let Hi=!1,Tn=!1,an=!1,mn=0,Ln=0,Ys=!1,Mu=0,as=!1,di=!1;const kr=[],Dt={cahaya:{name:"Pecahan Cahaya",cost:10,cd:.55,dmg:16,speed:27,color:16771496,kind:"bolt"},angin:{name:"Hembusan Aster",cost:14,cd:1.1,dmg:7,speed:20,color:12578530,kind:"knock"},perisai:{name:"Perisai Sekejap",cost:18,cd:6,dmg:0,color:9296850,kind:"shield"},proyektilRoh:{name:"Proyektil Roh",cost:12,cd:.8,dmg:13,speed:21,color:16747908,kind:"bolt"},jarumCahaya:{name:"Jarum Cahaya Ladang",cost:16,cd:.7,dmg:27,speed:30,color:16774064,kind:"bolt"},badaiJarum:{name:"Badai Jarum",cost:20,cd:1.3,dmg:15,speed:23,color:14221272,kind:"knock"},perisaiDuri:{name:"Perisai Berduri",cost:22,cd:7,dmg:0,color:11071704,kind:"shield"}},os={lightImpulse:1.7,mediumImpulse:3.6,heavyImpulse:6.8,launchImpulse:13.5,launchVertical:5,maxSpeed:15,dampingAir:1.1,dampingGround:2.1,dampingLaunched:.55,gravity:20,wallImpactSpeed:4.2,wallRecoil:2.4,wallRecoilPerSpeed:.18,staggerLight:.1,staggerMedium:.25,staggerHeavy:.5,staggerWall:.85,enemyRadius:.85};window.KNOCKBACK_CONFIG=os;const Xr=[],O0={"cahaya+proyektilRoh":"jarumCahaya","angin+proyektilRoh":"badaiJarum","perisai+proyektilRoh":"perisaiDuri"};function zo(){St.position.copy(z.position),St.rotation.set(z.pitch,z.yaw,z.roll)}function B0(){const i=ae("#staminaFill");i&&(i.style.width=`${Math.max(0,Math.round(z.stamina))}%`,i.style.opacity=z.sprintExhausted?.45:1)}function z0(){cl(),Qn(),ae("#startScreen").classList.remove("active"),Qr.classList.add("playing"),Je="playing",z.position.set(0,1.68,13),z.yaw=0,z.pitch=-.05,zo(),k0(),ct=!0,ae("#tutorialCard").classList.remove("hidden"),ae("#touchControls").setAttribute("aria-hidden",zt?"false":"true"),cs(),mt(392,.18,"sine",.04),setTimeout(()=>mt(523,.35,"sine",.035),130)}function Su(i=!0){i&&localStorage.removeItem("duel-interpretasi-checkpoint"),Object.keys(pt).forEach(e=>{pt[e]=0}),Zn.clear(),Vi.fill(null),gi=0,Hi=!1,di=!1,Tn=!1,an=!1,mn=0,Ln=0,z.mana=z.maxMana,z.pdCharges=3,w.hp=w.maxHp,ko="__reset__",Gi(!0),xi(),z.position.set(0,1.68,13),z.yaw=0,z.pitch=-.05,z.clarity=100,z.stamina=100,z.sprintExhausted=!1,z.testMode=null,z.dodgeVelocity.set(0,0,0),w.group.position.copy(w.anchor),w.group.scale.setScalar(.92),w.active=!1,w.revealed=!1,w.resolved=!1,w.rushing=!1,w.hp=w.maxHp,w.stunnedUntil=0,w.attackTimer=2.1,Dn.splice(0).forEach(e=>ke.remove(e.mesh)),Gi(),us(),cs(),Je="playing",ct=!1,ae("#resultScreen").classList.remove("active"),ae("#resolvePanel").classList.add("hidden"),ae("#synthesisPanel")?.classList.add("hidden"),as=!1,Hi?zt||setTimeout(Ki,80):ca("grantPanel")}function yu(){Je!=="playing"||w.resolved||(Pc={position:[z.position.x,z.position.y,z.position.z],archive:{...pt},formulas:[...Zn],slots:[...Vi],granted:Hi,clarity:z.clarity},localStorage.setItem("duel-interpretasi-checkpoint",JSON.stringify(Pc)))}function k0(){try{const i=JSON.parse(localStorage.getItem("duel-interpretasi-checkpoint"));if(!i)return;Array.isArray(i.position)&&z.position.fromArray(i.position),i.archive&&Object.assign(pt,i.archive),Array.isArray(i.formulas)&&i.formulas.forEach(e=>{Dt[e]&&Zn.add(e)}),Array.isArray(i.slots)&&i.slots.forEach((e,t)=>{Vi[t]=e&&Dt[e]?e:null}),Hi=!!i.granted||Zn.size>0,Gi(!0),xi(),z.clarity=Math.max(45,i.clarity||100),Gi(),us(),xt("Checkpoint desa dipulihkan.")}catch{localStorage.removeItem("duel-interpretasi-checkpoint")}}function Ki(){!zt&&Je==="playing"&&!ct&&document.pointerLockElement!==Bi&&Bi.requestPointerLock?.()}let Gt=null,Eu=0;const Tu=new Set(["synthesisPanel"]);function Rr(){const i=!!document.querySelector(".modal-card:not(.hidden)")||yr;Qr.classList.toggle("modal-open",i)}function V0(){ln.id=null,ln.x=0,ln.y=0;const i=ae("#joystickKnob");i&&(i.style.transform="translate(0,0)"),ki=null}function ca(i){ct=!0,Gt=i,Eu=performance.now(),V0(),document.exitPointerLock?.(),ae("#"+i).classList.remove("hidden"),Rr()}function ls(i){ae("#"+i).classList.add("hidden"),Gt===i&&(Gt=null),ct=!!document.querySelector(".modal-card:not(.hidden)"),Rr(),!ct&&!zt&&setTimeout(Ki,80)}document.addEventListener("pointerup",i=>{if(!Gt||!Tu.has(Gt)||performance.now()-Eu<450||i.target.closest?.(".modal-card, .round-action, .sys-btn, .modal-card *"))return;const e=ae("#"+Gt);e&&!e.contains(i.target)&&(Gt==="synthesisPanel"?ua():ls(Gt))});function xt(i,e=3100){const t=ae("#toast");t.textContent=i,t.classList.add("show"),clearTimeout(Cc),Cc=setTimeout(()=>t.classList.remove("show"),e)}function Jn(i=""){const e=ae("#worldPrompt");e.textContent=i,e.classList.toggle("show",!!i)}function cs(){const i=ae("#objective");w.resolved?i.textContent="Jelajahi desa setelah keputusanmu":di?i.textContent="Tentukan nasib Roh Ladang":Hi?pt.formula<100?i.textContent="Analisis Roh Ladang (Q) hingga formulanya Terverifikasi":i.textContent="Lumpuhkan mekanisme Roh Ladang dengan sihirmu":i.textContent="Terima pemberian pertamamu"}const H0={formula:["Formula proyektil roh — belum direkam","Terekam: proyektil energi merah, lintasan lurus ke target.","Struktur terbaca: inti energi terbentuk di dada roh sebelum ditembakkan.","TERVERIFIKASI — formula tersimpan di Archive dan siap dipakai."],mechanism:["Mekanisme roh — belum dianalisis","Teramati: roh terikat pada batu penanda di belakangnya.","Mekanisme: penanda adalah jangkar; roh kembali ke sana di antara serangan.","TERVERIFIKASI — kelemahan: serang saat ia tertegun (lonceng) untuk kerusakan besar."],identity:["Identitas roh — serpihan cerita (bonus)","Serpihan: ia menunggu seseorang yang tak pernah kembali.","Serpihan: amarahnya adalah takut ditinggalkan yang membusuk.","“Aku tetap menjaga… karena jika pergi, siapa yang akan menunggunya?”"]};function pr(i){return i>=100?3:i>=75?2:i>=40?1:0}let ko="";function Gi(i=!1){const e=`${pr(pt.formula)}|${pr(pt.mechanism)}|${pr(pt.identity)}`;if(e===ko&&!i)return;ko=e;const t=[pt.formula,pt.mechanism,pt.identity].filter(n=>n>=100).length;ae("#evidenceCount").textContent=`${t} / 3`,_i(".evidence").forEach(n=>{const r=n.dataset.key,s=pt[r]??0;n.classList.toggle("locked",s<100),n.classList.toggle("revealed",s>=100),n.querySelector("p").textContent=H0[r][pr(s)]}),cs()}function qr(i,e,t){const n=pr(pt[i]);pt[i]=Math.min(100,pt[i]+e),pr(pt[i])>n&&(Ln=Math.min(130,Ln+11),mt(523,.14,"sine",.04),xt(`Archive · ${i==="formula"?"Formula proyektil":i==="mechanism"?"Mekanisme roh":"Identitas roh"}: ${vu(pt[i])}`,2600),i==="formula"&&pt[i]>=100&&!Zn.has("proyektilRoh")&&(Qs("proyektilRoh"),xt("Formula Terverifikasi masuk Archive: “Proyektil Roh” kini bisa kamu pakai & sintesis.",4200)),i==="mechanism"&&pt[i]>=100&&xt("Kelemahan terverifikasi: roh menerima kerusakan besar saat tertegun lonceng.",4200)),Gi()}function Qs(i,e=!1){if(Zn.has(i))return;Zn.add(i);const t=Vi.indexOf(null);t>=0&&(Vi[t]=i),xi(),e||mt(659,.2,"sine",.04)}function xi(){_i(".spell-slot").forEach((i,e)=>{const t=Vi[e];i.classList.toggle("selected",e===gi),i.classList.toggle("empty",!t),i.querySelector("span").textContent=t?Dt[t].name:"Kosong"})}function ji(){ae("#manaValue").textContent=Math.round(z.mana),ae("#manaFill").style.width=`${z.mana/z.maxMana*100}%`,ae("#temporalFill").style.width=`${Math.min(100,mn/120*100)}%`,ae("#cognitiveFill").style.width=`${Math.min(100,Ln/130*100)}%`,_i("#pdDots i").forEach((e,t)=>e.classList.toggle("on",t<z.pdCharges));const i=ae("#enemyHpFill");i&&(i.style.width=`${Math.max(0,w.hp/w.maxHp*100)}%`)}function us(){const i=Math.max(0,Math.round(z.clarity));ae("#clarityValue").textContent=i,ae("#clarityFill").style.width=`${i}%`,ae("#clarityFill").style.background=i<35?"linear-gradient(90deg,#e85c59,#ff9b78)":"linear-gradient(90deg,#70dfba,#c4ffdb)",Qr.classList.toggle("low-clarity",i<35&&Je==="playing")}function G0(i){return Math.atan2(Math.sin(i),Math.cos(i))}function Dc(i){return Math.atan2(-(i.x-z.position.x),-(i.z-z.position.z))}function Xa(i,e,t){if(!i)return;const n=G0(e-z.yaw),r=n/Math.PI*165;i.style.transform=`translate(calc(-50% + ${r.toFixed(1)}px), -50%)`,i.style.opacity=t||Math.abs(n)>2.55?0:1}const W0={N:0,E:-Math.PI/2,S:Math.PI,W:Math.PI/2};function X0(){Je!=="menu"&&(_i("#compassStrip .cardinal").forEach(i=>Xa(i,W0[i.dataset.mark],!1)),Xa(ae("#compassEnemy"),Dc(w.group.position),w.resolved||!w.group.visible),Yt&&Xa(ae("#compassBell"),Dc(Yt.position),!1))}function ts(i){i&&(Je!=="playing"||ct)||!i&&!yr||(yr=i,ct=i,ae("#pauseScreen").classList.toggle("active",i),i?document.exitPointerLock?.():zt||setTimeout(Ki,80))}function bu(i){la=i,Wr&&(Wr.gain.value=i?0:1);const e=ae("#muteBtn");e&&(e.classList.toggle("off",i),e.textContent=i?"✕":"♪")}function Au(i){const e=performance.now()/1e3;if(!(e<z.invulnerableUntil||Je!=="playing")){if(e<Mu){zi(z.position,9296850,1.6),mt(660,.1,"sine",.04),xt("Perisai menahan serangan.",900);return}z.clarity-=i,z.invulnerableUntil=e+.55,us(),ae("#damageFlash").classList.add("hit"),setTimeout(()=>ae("#damageFlash").classList.remove("hit"),170),mt(82,.22,"sawtooth",.07),z.clarity<=0&&q0()}}function q0(){Je="fading",xt("Kamu pingsan dan dibangunkan di penanda desa. Archive-mu utuh — pengetahuan tidak ikut hilang.",2800),document.exitPointerLock?.(),setTimeout(()=>{z.position.set(0,1.68,10),z.clarity=100,z.mana=z.maxMana,z.pdCharges=3,w.hp=w.maxHp,di=!1,w.kbActive=!1,w.kbVel.set(0,0,0),w.kbY=0,w.group.rotation.x=0,ji(),z.invulnerableUntil=performance.now()/1e3+2,w.group.position.copy(w.anchor),w.rushing=!1,Dn.splice(0).forEach(i=>ke.remove(i.mesh)),us(),Je="playing",zt||Ki()},1800)}function ll(i=.91,e=28){St.getWorldDirection(sn),li.copy(w.group.position).add(new L(0,2.45,0)).sub(St.position);const t=li.length();return li.normalize(),t<e&&sn.dot(li)>i}function wu(){Je!=="playing"||ct||(Tn=!Tn,ae("#observeBtn")?.classList.toggle("eye-on",Tn),Jn(Tn?"Appraisal aktif — arahkan pandangan ke roh…":""),mt(Tn?330:220,.12,"sine",.03))}function Ru(){if(!(Je!=="playing"||ct)){if(!an&&Ys){xt("Mata kanan masih gelap. Biarkan beban temporalnya turun dulu.");return}an=!an,ae("#testBtn")?.classList.toggle("eye-on",an),mt(an?392:262,.12,"sine",.03)}}function Y0(){return mn>=120?3:mn>=60?2:mn>=30?1:0}function K0(i,e){if(an)mn+=i;else{const s=mn<30?4:mn<60?1.1:.45;mn=Math.max(0,mn-s*i)}mn>=120&&an&&(an=!1,Ys=!0,ae("#testBtn")?.classList.remove("eye-on"),xt("TEMPORAL SHUTDOWN — mata kanan gelap sementara. Beban harus turun di bawah separuh.",4200),mt(90,.5,"sawtooth",.05)),Ys&&mn<55&&(Ys=!1,xt("Penglihatan mata kanan kembali jernih."));const t=Y0();Qr.classList.toggle("fs-stage1",an&&t===1),Qr.classList.toggle("fs-stage2",an&&t>=2),Tn?Ln=Math.min(130,Ln+i*2.1):Ln=Math.max(0,Ln-i*4.5);const n=Ln>90?.3:Ln>60?.55:1;Tn&&Je==="playing"&&!ct&&w.group.visible&&!w.resolved&&fi(z.position,w.group.position)<30&&ll(.72,32)&&(qr("mechanism",i*8.5*n),Dn.length&&qr("formula",i*11*n),e<w.stunnedUntil&&qr("identity",i*13*n));const r=an&&Je!=="menu";if(Ui.visible=r&&w.group.visible,oa.visible=r,r){for(w.lastPos&&ai.push({t:e,v:w.group.position.clone().sub(w.lastPos).divideScalar(Math.max(i,.001))});ai.length&&e-ai[0].t>.6;)ai.shift();let s=new L;ai.length&&(s=t>=2?ai[0]?.v.clone()||s:ai[ai.length-1].v.clone()),Ui.position.copy(w.group.position).addScaledVector(s,1),Ui.rotation.y=w.group.rotation.y,t>=2&&(Ui.position.x+=Math.sin(e*7.3)*.22);let a=0;for(const o of Dn){if(a>=xu)break;const c=o.mesh.position,l=c.clone().addScaledVector(o.velocity,1);t>=2&&(l.x+=Math.sin(e*9+a)*.3),Xn[a*6]=c.x,Xn[a*6+1]=c.y,Xn[a*6+2]=c.z,Xn[a*6+3]=l.x,Xn[a*6+4]=l.y,Xn[a*6+5]=l.z,a++}for(let o=a*6;o<Xn.length;o++)Xn[o]=0;ol.attributes.position.needsUpdate=!0}w.lastPos=w.group.position.clone(),ji()}function Cu(){if(Je!=="playing"||ct)return;const i=Vi[gi],e=performance.now()/1e3;if(!i){xt("Slot ini kosong. Terima pemberian atau rancang formula lewat Synthesis (T).");return}const t=Dt[i];if((Lc[i]||0)>e)return;if(z.mana<t.cost){xt("Mana tidak cukup."),mt(140,.12,"square",.03);return}if(z.mana-=t.cost,Lc[i]=e+t.cd,mt(i==="perisai"||i==="perisaiDuri"?520:740,.09,"triangle",.035),t.kind==="shield"){Mu=e+(i==="perisaiDuri"?3.6:2.5),zi(z.position,9296850,2.2),xt("Perisai Sekejap aktif — proyektil roh tertahan.",1500),ji();return}St.getWorldDirection(sn);const n=je(new $n(.13,0),new un({color:t.color}),{shadow:!1});n.position.copy(St.position).addScaledVector(sn,.7),n.add(new ra(t.color,1.2,3,2)),ke.add(n),kr.push({mesh:n,velocity:sn.clone().multiplyScalar(t.speed),formula:i,born:e}),An(n.position,t.color,5,.7)}function j0(i,e,t=null){if(di||w.resolved)return;const n=Dt[i],r=performance.now()/1e3;let s=n.dmg;const a=r<w.stunnedUntil&&pt.mechanism>=100;a&&(s*=1.8,Jn("KELEMAHAN TERKENA!"),setTimeout(()=>Jn(""),700)),w.hp=Math.max(0,w.hp-s),An(e,n.color,16,2),mt(180,.1,"sawtooth",.04),$0(i,s,t,a,r),ji(),w.hp<=0&&Z0()}function $0(i,e,t,n,r){const s=os,a=Dt[i];if(!a||a.dmg<=0)return;const o=new L;t&&o.copy(t).setY(0),o.lengthSq()<.01&&o.copy(w.group.position).sub(z.position).setY(0),o.normalize();let c="light";n&&e>=24||e>=30?c="launch":a.kind==="knock"||e>=20?c="heavy":e>=12&&(c="medium");const l=c==="launch"?s.launchImpulse:c==="heavy"?s.heavyImpulse:c==="medium"?s.mediumImpulse:s.lightImpulse;w.kbVel.addScaledVector(o,l),w.kbVel.length()>s.maxSpeed&&w.kbVel.setLength(s.maxSpeed),c==="launch"&&(w.kbVy=Math.max(w.kbVy,s.launchVertical),w.launched=!0,w.bounced=!1,w.skidTimer=0),w.kbActive=!0,w.kbWallHitDone=!1,w.reactUntil=r+(c==="launch"?.7:c==="heavy"?.5:c==="medium"?.35:.22),w.reactPower=c==="launch"?1:c==="heavy"?.75:c==="medium"?.45:.2;const h=c==="launch"||c==="heavy"?s.staggerHeavy:c==="medium"?s.staggerMedium:s.staggerLight;w.kbStaggerUntil=Math.max(w.kbStaggerUntil,r+h),w.attackTimer+=c==="heavy"||c==="launch"?1.4:c==="medium"?.8:.25,c!=="light"&&Jn(c==="launch"?"TERLONTAR!":c==="heavy"?"HANTAMAN KERAS":""),c!=="light"&&setTimeout(()=>Jn(""),650)}function Z0(i){di=!0,w.kbActive=!1,w.kbVel.set(0,0,0),w.kbY=0,w.group.rotation.x=0,w.revealed=!0,an=!1,pt.identity=100,Gi(!0),ae("#enemyState").textContent="Penjaga yang tak pernah dibebaskan",An(w.group.position.clone().add(new L(0,2.2,0)),10416841,52,3.2),zi(w.group.position,10416841,8),ul([392,494,659],.8),xt("Mekanisme lumpuh. Identitasnya terbaca: penjaga yang takut ditinggalkan. Tentukan nasibnya.",4200),setTimeout(()=>{w.resolved||ca("resolvePanel")},1600)}function J0(){if(Je!=="playing"||ct)return;const i=performance.now()/1e3;if(Yt&&fi(z.position,Yt.position)<4.5){Q0(i);return}if(fi(z.position,w.anchor)<5){qr("identity",18),xt("Batu penanda: nama yang ditunggu terukir di sini, hampir terhapus waktu.",3200);return}xt("Tidak ada yang bisa diajak berinteraksi di dekat sini. Lonceng tua ada di barat ladang.",2600)}function Q0(i){w.stunnedUntil=i+4.6,w.bellRecentUntil=i+6.3,w.rushing=!1,Yt?.userData.body&&(Yt.userData.body.rotation.z=.35,setTimeout(()=>{Yt?.userData.body&&(Yt.userData.body.rotation.z=0)},650)),zi(Yt.position,16765543,12),setTimeout(()=>zi(w.group.position,16765543,5),230),An(w.group.position.clone().add(new L(0,2.3,0)),16765543,25,1.7),m_(),Tn&&qr("identity",22),xt("Suara lonceng mencapai ladang. Roh itu berhenti… dan menunduk. Serang sekarang bila Mekanismenya sudah terverifikasi.",3800)}function Pu(){if(Je!=="playing"||ct)return;const i=performance.now()/1e3;if(i<z.invulnerableUntil-.2)return;let e=z.lastMove.clone();e.lengthSq()<.08?e.copy(z.position).sub(w.group.position).setY(0).normalize():e.normalize(),z.dodgeVelocity.copy(e).multiplyScalar(8.2),z.fovKick=8,z.invulnerableUntil=i+.58,mt(240,.08,"sine",.025)}function e_(i,e){return z.pdCharges<=0||e<z.pdReadyAt||(St.getWorldDirection(sn),li.copy(i).sub(z.position).setY(0).normalize(),!(sn.setY(0).normalize().dot(li)<.15)&&!(Tn||as))?!1:(z.pdCharges--,z.pdReadyAt=e+2,li.copy(z.position).sub(i).setY(0).normalize(),z.dodgeVelocity.copy(li).multiplyScalar(10.5),z.fovKick=10,z.invulnerableUntil=e+.7,Jn("PERFECT DODGE"),setTimeout(()=>Jn(""),800),An(z.position.clone().add(new L(0,1,0)),16765543,18,2.2),mt(880,.16,"sine",.05),setTimeout(()=>mt(1174,.22,"sine",.04),70),ji(),!0)}let Pt=[];function Lu(){Je!=="playing"||ct||(as=!0,Pt=[],Iu(),ca("synthesisPanel"))}function Du(){return Pt.length!==2||Pt[0]===Pt[1]?null:O0[[...Pt].sort().join("+")]||null}function Iu(){const i=ae("#synthList");i.innerHTML="";const e=[...Zn];e.length||(i.innerHTML='<p class="modal-copy">Archive masih kosong. Analisis roh (Q) atau terima pemberian dulu.</p>'),e.forEach(s=>{const a=document.createElement("button");Pt.includes(s)&&a.classList.add("picked"),a.innerHTML=`<i>${Pt.includes(s)?"✓":"·"}</i><span><b>${Dt[s].name}</b><small>Mana ${Dt[s].cost} · kerusakan ${Dt[s].dmg}</small></span>`,Ut(a,()=>{Pt.includes(s)?Pt=Pt.filter(o=>o!==s):(Pt.push(s),Pt.length>2&&Pt.shift()),Iu()}),i.appendChild(a)});const t=Du(),n=ae("#synthResult"),r=ae("#synthCraft");Pt.length===2?t?(n.textContent=`Kombinasi terbaca jelas → “${Dt[t].name}” (kerusakan ${Dt[t].dmg}, mana ${Dt[t].cost}).`,r.disabled=Zn.has(t),r.disabled&&(n.textContent+=" Sudah kamu miliki.")):(n.textContent="Kombinasi ini belum punya hubungan mekanis yang jelas. Tetap bisa dirancang — hasilnya versi lemah dan tidak stabil.",r.disabled=!1):(n.textContent=e.length?`Pilih ${2-Pt.length} formula lagi.`:"Belum ada kombinasi dipilih.",r.disabled=!0)}function t_(){if(Pt.length!==2)return;const i=Du();if(i)Qs(i),xt(`Formula baru dirancang: “${Dt[i].name}”.`,3600),ul([523,659,784],.6);else{const[e,t]=Pt.map(r=>Dt[r]),n="lemah"+Date.now();Dt[n]={name:"Sintesis Belum Stabil",cost:Math.round((e.cost+t.cost)/2),cd:1.2,dmg:Math.max(3,Math.round((e.dmg+t.dmg)/2*.45)),speed:20,color:13621468,kind:"bolt"},Qs(n),xt("Rancangan dipaksakan: hasilnya lemah dan tidak stabil. Sempurnakan di tempat aman kelak.",3800),mt(160,.3,"sawtooth",.04)}ua()}function ua(){as=!1,ls("synthesisPanel")}const n_={purify:{sigil:"○",title:"Penjaga yang Memilih",text:"Kamu memisahkan rasa takut dari tugasnya. Roh itu tetap berada di ladang—bukan karena terikat, tetapi karena untuk pertama kalinya ia memilih sendiri.",quote:"“Menunggu dan memilih untuk tinggal ternyata bukan hal yang sama.”",sky:11066328},bind:{sigil:"◇",title:"Saksi yang Dibawa Pergi",text:"Kamu mengikat ingatannya sebagai Saksi. Ia akan membantumu membaca rasa kehilangan, tetapi sejak malam itu lonceng Desa Aster tidak pernah lagi menghasilkan suara.",quote:"“Jika aku ikut denganmu, biarkan tempat ini belajar menunggu tanpa aku.”",sky:9223368},destroy:{sigil:"×",title:"Ladang Tanpa Penunggu",text:"Ancaman berakhir seketika. Keesokan harinya ladang terasa aman, tetapi tak seorang pun di desa dapat mengingat siapa yang dahulu mereka tunggu.",quote:"“Sesuatu telah hilang. Tidak ada yang dapat mengatakan apa.”",sky:8558501}};function i_(i){if(!w.revealed||ae("#resolvePanel").classList.contains("hidden"))return;ae("#resolvePanel").classList.add("hidden"),Gt=null,Rr(),w.resolved=!0,w.revealed=!0,Je="resolved",ct=!0;const e=n_[i];ae("#resultSigil").textContent=e.sigil,ae("#resultTitle").textContent=e.title,ae("#resultText").textContent=e.text,ae("#resultQuote").textContent=e.quote,ke.background.setHex(e.sky),ke.fog.color.setHex(e.sky),al.topColor.value.setHex(e.sky),w.group.userData.outcome=i,i==="destroy"?(An(w.group.position.clone().add(new L(0,2,0)),16742253,70,4.4),w.group.visible=!1,mt(70,.65,"sawtooth",.06)):(w.group.visible=!0,An(w.group.position.clone().add(new L(0,2,0)),i==="purify"?10416841:16765543,65,3.6),w.group.scale.setScalar(i==="purify"?.76:.64),ul(i==="purify"?[392,523,659]:[330,440,554],1)),localStorage.setItem("duel-interpretasi-outcome",i),localStorage.removeItem("duel-interpretasi-checkpoint"),setTimeout(()=>ae("#resultScreen").classList.add("active"),1e3)}function fi(i,e){const t=i.x-e.x,n=i.z-e.z;return Math.hypot(t,n)}function r_(i){i.x=on.clamp(i.x,-30,30),i.z=on.clamp(i.z,-29,27);for(const t of wr){const n=i.x-t.x,r=i.z-t.z,s=Math.hypot(n,r),a=t.r+.42;s<a&&s>.001&&(i.x=t.x+n/s*a,i.z=t.z+r/s*a)}}function s_(){let i=ln.x,e=-ln.y;ci.has("KeyA")&&(i-=1),ci.has("KeyD")&&(i+=1),ci.has("KeyW")&&(e+=1),ci.has("KeyS")&&(e-=1);const t=Math.hypot(i,e);return t>1&&(i/=t,e/=t),{x:i,y:e}}function a_(i,e){if(Je!=="playing"||ct||F0){z.lastMove.multiplyScalar(.75),zo();return}const t=s_(),n=new L(-Math.sin(z.yaw),0,-Math.cos(z.yaw)),r=new L(Math.cos(z.yaw),0,-Math.sin(z.yaw)),s=n.multiplyScalar(t.y).add(r.multiplyScalar(t.x));s.lengthSq()>1&&s.normalize(),z.lastMove.lerp(s,Math.min(1,i*10));const a=(ci.has("ShiftLeft")||ci.has("ShiftRight"))&&t.y>.25&&s.length()>.2;z.sprintExhausted&&z.stamina>25&&(z.sprintExhausted=!1),z.sprinting=a&&!z.sprintExhausted&&z.stamina>1,z.stamina=on.clamp(z.stamina+(z.sprinting?-26:17)*i,0,100),z.stamina<=0&&(z.sprintExhausted=!0);const o=z.sprinting?6.4:4.15,c=z.position.clone(),l=z.position.clone().addScaledVector(s,o*i).addScaledVector(z.dodgeVelocity,i);z.dodgeVelocity.multiplyScalar(Math.pow(.03,i));const h=Math.min(1,s.length());z.bobPhase+=i*(z.sprinting?11.5:8.2)*h,l.y=1.68+Math.sin(z.bobPhase*2)*.028*h,z.roll=on.lerp(z.roll,-t.x*.016-z.dodgeVelocity.x*.004,Math.min(1,i*9)),z.fovKick=on.lerp(z.fovKick,0,Math.min(1,i*5));const d=68+(z.sprinting?7:0)+z.fovKick;Math.abs(St.fov-d)>.02&&(St.fov=on.lerp(St.fov,d,Math.min(1,i*8)),St.updateProjectionMatrix()),r_(l),z.position.copy(l),z.stepDistance+=c.setY(0).distanceTo(z.position.clone().setY(0)),z.stepDistance>(z.sprinting?3.1:2.35)&&h>.25&&(z.stepDistance=0,mt(z.bobPhase%2<1?82:71,.07,"triangle",.012)),B0(),zo();const f=fi(z.position,w.group.position);f<24&&(w.active=!0),z.testMode==="retreat"&&(f>z.testStartDistance+3.2||e>z.retreatDeadline)&&(z.testMode=null,w.rushing=!0,w.rushEnd=e+4.5,w.rushRecentUntil=e+6.5,w.enragedUntil=e+3,xt("Roh itu meninggalkan posnya dan mengejarmu dengan panik. Berbalik dan AMATI!",4200),cs(),mt(110,.4,"sawtooth",.06)),z.mana=Math.min(z.maxMana,z.mana+i*7),fi(z.position,new L(0,0,13))<4&&fi(z.position,w.group.position)>20&&z.pdCharges<3&&(z.pdCharges=3,ji()),z.saveTimer+=i,z.saveTimer>6&&(z.saveTimer=0,yu())}function Ic(i,e,t,n){const r=os;w.kbWallHitDone=!0;const s=e.clone(),a=-w.kbVel.dot(s),o=w.kbVel.clone().addScaledVector(s,a);w.kbVel.copy(o.multiplyScalar(.35)).addScaledVector(s,r.wallRecoil+t*r.wallRecoilPerSpeed),w.kbStaggerUntil=Math.max(w.kbStaggerUntil,n+r.staggerWall),w.reactUntil=n+.6,w.reactPower=1,o_(i,s,t),Bo(i,s,Math.min(3,t*.35)),aa({intensity:on.clamp(.45+t*.055,.5,.95),position:i.clone(),direction:s.clone(),style:t>7?"silhouette":"radial",duration:t>7?4:3}),mt(70,.25,"sawtooth",.06),Jn("TABRAKAN DINDING!"),setTimeout(()=>Jn(""),800)}function o_(i,e,t){An(i,16777215,Math.round(10+t*2),2.4),An(i,2175802,Math.round(8+t),1.8);const n=i.clone();n.y=.09,zi(n,16777215,3+t*.35);const r=new un({color:1318954,transparent:!0,opacity:.85,depthWrite:!1}),s=new It;for(let a=0;a<5;a++){const o=new Et(new Kt(.34+a%3*.16,.028,.012),r);o.position.set(qe(a*3.3,-.2,.2),qe(a*7.7,-.25,.3),0),o.rotation.z=qe(a*5.1,-1.1,1.1),s.add(o)}s.position.copy(i),s.lookAt(i.clone().add(e)),ke.add(s),Xr.push({group:s,mat:r,age:0,life:2.4,grow:.22,baseOpacity:.85})}function l_(i){const e=os,t=w.group.position,n=e.enemyRadius,r=[{hit:t.x>30-n,nx:-1,nz:0,cx:30,cz:t.z},{hit:t.x<-30+n,nx:1,nz:0,cx:-30,cz:t.z},{hit:t.z>27-n,nx:0,nz:-1,cx:t.x,cz:27},{hit:t.z<-29+n,nx:0,nz:1,cx:t.x,cz:-29}];for(const s of r){if(!s.hit)continue;s.nx<0?t.x=30-n:s.nx>0&&(t.x=-30+n),s.nz<0?t.z=27-n:s.nz>0&&(t.z=-29+n);const a=new L(s.nx,0,s.nz),o=-w.kbVel.dot(a),c=new L(s.cx,1.6,s.cz);o>e.wallImpactSpeed&&!w.kbWallHitDone?Ic(c,a,o,i):o>0&&w.kbVel.addScaledVector(a,o)}for(const s of wr){const a=t.x-s.x,o=t.z-s.z,c=Math.hypot(a,o),l=s.r+n;if(c>=l||c<1e-4)continue;const h=new L(a/c,0,o/c);t.x=s.x+h.x*l,t.z=s.z+h.z*l;const d=-w.kbVel.dot(h),f=new L(s.x+h.x*s.r,1.6,s.z+h.z*s.r);d>e.wallImpactSpeed&&!w.kbWallHitDone?Ic(f,h,d,i):d>0&&w.kbVel.addScaledVector(h,d)}}function c_(i,e){const t=os,n=w.group.position,r=w.kbVel.length(),s=Math.max(1,Math.ceil(r*i/.3)),a=i/s;for(let d=0;d<s;d++)n.addScaledVector(w.kbVel,a),l_(e);const o=w.kbY>0||w.kbVy>0,c=w.kbVy;if(o&&(w.kbVy-=t.gravity*i,w.kbY+=w.kbVy*i,w.kbY<=0)){if(w.kbY=0,c<-3.5){const f=n.clone();f.y=.4,Bo(f,new L(0,1,0),Math.min(3,r*.3)),Rc(n,.55+Math.min(1.2,r*.09),4),zi(n.clone().setY(.09),14209732,3.5),mt(65,.2,"sawtooth",.05),r>6&&!w.bounced&&(w.kbVy=2.3,w.bounced=!0)}w.kbVy<=0&&(w.kbVy=0),(!w.bounced||w.kbVy===0)&&(w.launched=w.launched&&r>5)}n.y=Math.sin(e*2.1)*.055+w.kbY;const l=w.kbY>0?t.dampingAir:w.launched?t.dampingLaunched:t.dampingGround;if(w.kbVel.multiplyScalar(Math.exp(-l*i)),w.kbY===0&&w.kbVel.length()>4&&(w.skidTimer=(w.skidTimer||0)-i,w.skidTimer<=0)){w.skidTimer=.07;const d=n.clone();d.y=.25,Bo(d,w.kbVel.clone().normalize().negate(),.7),(!w.lastSkidPos||w.lastSkidPos.distanceTo(n)>1.1)&&(w.lastSkidPos=n.clone(),Rc(n,.42,5))}w.kbVel.length()<2&&(w.launched=!1);const h=e<w.reactUntil?w.reactPower:0;w.group.rotation.x=-Math.min(.45,w.kbVel.length()*.04)-h*.12,w.head&&(w.head.rotation.x=-h*.55),w.kbVel.length()<.45&&w.kbY===0&&(w.kbActive=!1,w.kbVel.set(0,0,0),w.group.rotation.x=0)}function u_(i,e){const t=fi(z.position,w.group.position),n=ll(.79);if(ae("#crosshair").classList.toggle("target",n&&t<28),ae("#enemyTag").classList.toggle("visible",n&&t<26&&w.group.visible),w.resolved){w.group.rotation.y+=i*.12,w.group.position.y=Math.sin(e*1.3)*.07;return}if(Je==="revelation"){w.group.rotation.y+=i*.7,w.group.position.y=Math.sin(e*2.5)*.14,w.aura.material.color.setHex(10416841),w.aura.material.opacity=.55,w.aura.scale.setScalar(1.3+Math.sin(e*3)*.12);return}w.group.position.y=Math.sin(e*2.1)*.055,w.head.rotation.z=Math.sin(e*1.7)*.045,w.aura.rotation.z+=i*.3,w.aura.scale.setScalar(1+Math.sin(e*3.2)*.08),w.threads.rotation.y-=i*.22,w.runes&&(w.runes.rotation.y+=i*(e<w.enragedUntil?1.6:.45),w.runes.material.color.setHex(w.revealed?10416841:e<w.enragedUntil?16734798:16747908));const r=sn.set(z.position.x,w.group.position.y,z.position.z);if(w.group.lookAt(r),Je==="playing"&&!ct&&w.kbActive&&!di&&c_(i,e),Je!=="playing"||ct||!w.active||di)return;if(e<w.stunnedUntil){w.head.rotation.x=.42,ae("#enemyState").textContent="Mengingat sesuatu";return}if(e>=w.reactUntil&&w.head&&(w.head.rotation.x=0),ae("#enemyState").textContent=di?"Mekanisme lumpuh":e<w.kbStaggerUntil?"Terpental…":Tn?vu(Math.max(pt.mechanism,pt.formula)):"Tidak terbaca",w.kbActive||e<w.kbStaggerUntil)return;if(w.rushing){sn.copy(z.position).sub(w.group.position).setY(0);const a=sn.length();a>.01&&w.group.position.addScaledVector(sn.normalize(),i*7.1),a<2.1?(Au(24),w.rushing=!1,w.group.position.copy(w.anchor)):e>w.rushEnd&&(w.rushing=!1,w.group.position.lerp(w.anchor,.35));return}const s=fi(w.group.position,w.anchor);s>.15&&(sn.copy(w.anchor).sub(w.group.position).setY(0),w.group.position.addScaledVector(sn.normalize(),Math.min(s,i*1.4))),w.attackTimer-=i*(e<w.enragedUntil?1.8:1),w.attackTimer<=0&&t<25&&(N0(e),w.attackTimer=2.85)}function h_(i,e){for(let t=Dn.length-1;t>=0;t--){const n=Dn[t];if(n.mesh.position.addScaledVector(n.velocity,i),n.mesh.rotation.x+=i*8,n.mesh.rotation.y+=i*5,n.mesh.position.distanceTo(z.position)<.55){if(e_(n.mesh.position.clone(),e)){ke.remove(n.mesh),Dn.splice(t,1);continue}z.dodgeVelocity.addScaledVector(n.velocity.clone().setY(0).normalize(),2),Au(18),An(n.mesh.position,16736857,14,1.8),ke.remove(n.mesh),Dn.splice(t,1);continue}e-n.born>n.life&&(ke.remove(n.mesh),Dn.splice(t,1))}for(let t=kr.length-1;t>=0;t--){const n=kr[t];n.mesh.position.addScaledVector(n.velocity,i),n.mesh.rotation.x+=i*9;const r=w.group.position.clone().add(new L(0,2.2,0));if(w.group.visible&&n.mesh.position.distanceTo(r)<1.15){const s=w.hp,a=Dt[n.formula]?.dmg||10;aa({intensity:s<=a?1:a>=20?.85:a>=13?.6:.4,position:n.mesh.position.clone(),style:s<=a?"alternating":a>=20?"silhouette":"radial",duration:s<=a?6:3}),j0(n.formula,n.mesh.position.clone(),n.velocity.clone()),ke.remove(n.mesh),kr.splice(t,1);continue}(e-n.born>2.6||n.mesh.position.y<0)&&(ke.remove(n.mesh),kr.splice(t,1))}for(let t=Ni.length-1;t>=0;t--){const n=Ni[t];n.age+=i;const r=n.points.geometry.attributes.position;for(let s=0;s<n.velocities.length;s++)r.array[s*3]+=n.velocities[s].x*i,r.array[s*3+1]+=n.velocities[s].y*i,r.array[s*3+2]+=n.velocities[s].z*i,n.velocities[s].y-=i*(n.gravity??.65);r.needsUpdate=!0,n.points.material.opacity=Math.max(0,(n.baseOpacity??1)*(1-n.age/(n.life??1.35))),n.age>(n.life??1.35)&&(ke.remove(n.points),n.points.geometry.dispose(),n.points.material.dispose(),Ni.splice(t,1))}for(let t=Xs.length-1;t>=0;t--){const n=Xs[t];n.age+=i;const r=Math.min(1,n.age/1.15);n.mesh.scale.setScalar(1+r*n.maxScale),n.mesh.material.opacity=(1-r)*.72,r>=1&&(ke.remove(n.mesh),n.mesh.geometry.dispose(),n.mesh.material.dispose(),Xs.splice(t,1))}for(let t=Xr.length-1;t>=0;t--){const n=Xr[t];n.age+=i;const r=n.life??.9;n.mat.opacity=Math.max(0,(n.baseOpacity??.85)*(1-n.age/r)),n.group.scale.multiplyScalar(1+(n.grow??.7)*i),n.age>r&&(ke.remove(n.group),n.mat.dispose(),Xr.splice(t,1))}_u.forEach(t=>{t.position.x+=i*t.userData.speed,t.position.x>42&&(t.position.x=-42)}),fu.forEach(t=>{t.obj.rotation.z=Math.sin(e*1.1+t.phase)*t.amp}),Gr&&(Gr.rotation.y=e*.014,Gr.position.y=Math.sin(e*.35)*.35),gu.forEach(t=>{t.position.x+=i*t.userData.speed,t.position.y+=Math.sin(e*1.4+t.userData.phase)*i*.35;const n=Math.sin(e*9+t.userData.phase)*.55;t.userData.left.rotation.z=n,t.userData.right.rotation.z=-n,t.position.x>44&&(t.position.x=-44)})}function d_(i,e){if(!qn.gem)return;const t=Je!=="menu";if(Sn.visible=t,!t)return;const n=z.dodgeVelocity.length()>1.2,r=qn.basePos.clone();n&&(r.x-=.1),r.y+=Math.sin(z.bobPhase*2)*.012*Math.min(1,z.lastMove.length()+.25),r.x+=Math.sin(z.bobPhase)*.008,Sn.position.lerp(r,Math.min(1,i*6)),Sn.rotation.z=.06+Math.sin(e*1.3)*.02-z.roll*1.6,Sn.rotation.x=.15+Math.sin(z.bobPhase*2)*.02,qn.ring.rotation.z+=i*.5;const s=ll(.88,30),a=pt.formula>=100&&!w.resolved,o=a?10416841:s?16765543:9296850;qn.gem.material.color.setHex(o),qn.gem.material.emissive.setHex(o),qn.gemLight.color.setHex(o);const c=1+Math.sin(e*2.2)*.08;qn.gem.scale.setScalar(c),qn.gemLight.intensity=(s||a?1.6:.7)*c}function f_(i){Sn.visible=!1,St.position.set(8+Math.sin(i*.08)*2.2,5.3+Math.sin(i*.18)*.25,12+Math.cos(i*.08)*1.6),St.lookAt(0,2,-7.5),w.group.position.y=Math.sin(i*1.6)*.05,w.aura.rotation.z+=.003}let qa=0,zs=0;function p_(i){if(qa++,zs+=i,zs<1)return;const e=Math.round(qa/zs);qa=0,zs=0;const t=ae("#fpsValue");t&&(t.textContent=e);const n=Zt.getPixelRatio();e<38&&n>1&&Zt.setPixelRatio(Math.max(1,n-.25));const r=Zt.getPixelRatio(),s=ae("#qualityValue");s&&(s.textContent=r>1.5?"TINGGI":r>1.15?"SEDANG":"HEMAT")}function Uu(){requestAnimationFrame(Uu);const i=Math.min(y0.getDelta(),.05),e=i*(as?.12:1),t=performance.now()/1e3;if(p_(i),yr){es.render(ke,St);return}Je==="menu"?f_(t):(a_(e,t),u_(e,t),h_(e,t),d_(e,t),X0(),K0(e,t)),es.render(ke,St)}Uu();function cl(){yn||(yn=new(window.AudioContext||window.webkitAudioContext),Wr=yn.createGain(),Wr.gain.value=la?0:1,Wr.connect(yn.destination)),yn.state==="suspended"&&yn.resume()}function mt(i,e=.2,t="sine",n=.035,r=0){if(!yn)return;const s=yn.currentTime+r,a=yn.createOscillator(),o=yn.createGain();a.type=t,a.frequency.setValueAtTime(i,s),o.gain.setValueAtTime(1e-4,s),o.gain.exponentialRampToValueAtTime(Math.max(2e-4,n),s+.018),o.gain.exponentialRampToValueAtTime(1e-4,s+e),a.connect(o).connect(yn.destination),a.start(s),a.stop(s+e+.04)}function ul(i,e=.65){i.forEach((t,n)=>mt(t,e,"sine",.025,n*.035))}function m_(){[523,784,1046,1318].forEach((i,e)=>mt(i,1.25-e*.08,"sine",.035/(1+e*.25),e*.025))}let g_=0;addEventListener("keydown",i=>{if(ci.add(i.code),i.code==="KeyI"&&!i.repeat){const e=["radial","invert","silhouette","alternating"],t=e[g_++%e.length];aa({intensity:.9,position:w.group.position.clone().add(new L(0,2.2,0)),style:t,duration:t==="alternating"?6:3}),xt(`Uji impact frame: ${t} (tekan I lagi untuk gaya berikutnya)`,1400)}if(!i.repeat){if(i.code==="KeyQ"&&wu(),i.code==="KeyE"&&Ru(),i.code==="KeyT"&&Lu(),i.code==="KeyF"&&J0(),i.code==="Space"&&(i.preventDefault(),Pu()),i.code.startsWith("Digit")){const e=Number(i.code.slice(5));e>=1&&e<=4&&(gi=e-1,xi())}i.code==="KeyP"&&ts(!yr),i.code==="Escape"&&(Gt==="synthesisPanel"?ua():Gt&&Tu.has(Gt)?ls(Gt):yr&&ts(!1)),i.code==="KeyM"&&(cl(),bu(!la))}});addEventListener("keyup",i=>ci.delete(i.code));addEventListener("mousemove",i=>{document.pointerLockElement!==Bi||ct||Je!=="playing"||(z.yaw-=i.movementX*.00215,z.pitch-=i.movementY*.00185,z.pitch=on.clamp(z.pitch,-1.22,1.22))});Bi.addEventListener("click",Ki);Bi.addEventListener("mousedown",i=>{i.button===0&&document.pointerLockElement===Bi&&Je==="playing"&&!ct&&Cu()});addEventListener("wheel",i=>{Je!=="playing"||ct||(gi=(gi+(i.deltaY>0?1:3))%4,xi())},{passive:!0});const Er=ae("#joystick"),Nu=ae("#joystickKnob");function Fu(i){const e=Er.getBoundingClientRect(),t=e.left+e.width/2,n=e.top+e.height/2;let r=i.clientX-t,s=i.clientY-n;const a=e.width*.32,o=Math.hypot(r,s);o>a&&(r=r/o*a,s=s/o*a),ln.x=r/a,ln.y=s/a,Nu.style.transform=`translate(${r}px, ${s}px)`}Er.addEventListener("pointerdown",i=>{i.preventDefault(),ln.id=i.pointerId,Er.setPointerCapture(i.pointerId),Fu(i)});Er.addEventListener("pointermove",i=>{i.pointerId===ln.id&&Fu(i)});function Ou(i){i.pointerId===ln.id&&(ln.id=null,ln.x=ln.y=0,Nu.style.transform="translate(0,0)")}Er.addEventListener("pointerup",Ou);Er.addEventListener("pointercancel",Ou);const ns=ae("#lookZone");ns.addEventListener("pointerdown",i=>{ct||(ki=i.pointerId,qs={x:i.clientX,y:i.clientY},ns.setPointerCapture(i.pointerId))});ns.addEventListener("pointermove",i=>{if(i.pointerId!==ki||ct)return;const e=i.clientX-qs.x,t=i.clientY-qs.y;qs={x:i.clientX,y:i.clientY},z.yaw-=e*.0045,z.pitch-=t*.0038,z.pitch=on.clamp(z.pitch,-1.18,1.18)});ns.addEventListener("pointerup",i=>{i.pointerId===ki&&(ki=null)});ns.addEventListener("pointercancel",i=>{i.pointerId===ki&&(ki=null)});function Ut(i,e){if(!i)return;let t=0;const n=r=>{const s=performance.now();s-t<450||(t=s,r.preventDefault?.(),r.stopPropagation?.(),e(r))};i.addEventListener("pointerup",n),i.addEventListener("click",n)}Ut(ae("#startBtn"),z0);Ut(ae("#resetBtn"),()=>{localStorage.removeItem("duel-interpretasi-checkpoint"),localStorage.removeItem("duel-interpretasi-outcome"),ae("#resetBtn").textContent="Checkpoint dihapus"});Ut(ae("#tutorialOk"),()=>{ae("#tutorialCard").classList.add("hidden"),ct=!1,Gt=null,Rr(),Hi?zt||Ki():ca("grantPanel")});_i("[data-grant]").forEach(i=>Ut(i,()=>{Qs(i.dataset.grant),Hi=!0,gi=0,xi(),ls("grantPanel"),yu(),xt(`Pemberian diterima: “${Dt[i.dataset.grant].name}”. Sekarang analisis roh itu (Q) — jangan hanya menyerangnya.`,4600)}));Ut(ae("#synthCraft"),t_);ae("#synthesisPanel")?.addEventListener("pointerup",()=>{Rr()});ae("#observeBtn")?.addEventListener("pointerdown",i=>{i.preventDefault(),wu()});ae("#testBtn")?.addEventListener("pointerdown",i=>{i.preventDefault(),Ru()});ae("#castBtn")?.addEventListener("pointerdown",i=>{i.preventDefault(),Cu()});ae("#dodgeBtn")?.addEventListener("pointerdown",i=>{i.preventDefault(),Pu()});ae("#interpretBtn")?.addEventListener("pointerdown",i=>{i.preventDefault(),Lu()});Ut(ae("#evidenceToggle"),()=>ae("#evidencePanel")?.classList.toggle("collapsed"));Ut(ae("#pauseBtn"),()=>ts(!0));Ut(ae("#muteBtn"),()=>{cl(),bu(!la)});Ut(ae("#fullscreenBtn"),__);Ut(ae("#resumeBtn"),()=>ts(!1));Ut(ae("#restartBtn"),()=>{ts(!1),Su(!0),xt("Encounter dimulai ulang dari penanda desa.")});_i("[data-close]").forEach(i=>Ut(i,()=>{i.dataset.close==="synthesisPanel"?ua():ls(i.dataset.close)}));_i(".spell-slot").forEach(i=>Ut(i,()=>{gi=Number(i.dataset.slot),xi()}));_i("[data-resolve]").forEach(i=>Ut(i,()=>i_(i.dataset.resolve)));Ut(ae("#replayBtn"),()=>{ke.background.setHex(9555673),ke.fog.color.setHex(9555673),al.topColor.value.setHex(6271695),w.group.visible=!0,Su(!0)});Ut(ae("#continueExploreBtn"),()=>{ae("#resultScreen").classList.remove("active"),ct=!1,Gt=null,Rr(),Je="playing",cs(),zt||Ki(),xt("Prototipe selesai. Kamu masih dapat menjelajahi Desa Aster.")});function Qn(){const i=window.visualViewport,e=Math.round(i?.width||innerWidth),t=Math.round(i?.height||innerHeight);!e||!t||(St.aspect=e/t,St.updateProjectionMatrix(),Zt.setPixelRatio(Math.min(devicePixelRatio,zt?1.35:1.8)),Zt.setSize(e,t),es.setSize(e,t,Zt.getPixelRatio()))}addEventListener("resize",Qn);addEventListener("orientationchange",()=>{setTimeout(Qn,60),setTimeout(Qn,350)});window.visualViewport?.addEventListener("resize",Qn);document.addEventListener("fullscreenchange",()=>setTimeout(Qn,120));Qn();async function __(){try{if(document.fullscreenElement)await document.exitFullscreen();else{const i=document.documentElement;if(i.requestFullscreen)try{await i.requestFullscreen({navigationUI:"hide"})}catch{await i.requestFullscreen()}if(zt&&screen.orientation?.lock)try{await screen.orientation.lock("landscape")}catch{}}}catch{}setTimeout(Qn,120),setTimeout(Qn,450)}addEventListener("contextmenu",i=>i.preventDefault());Gi(!0);us();xi();ji();zt&&ae("#evidencePanel")?.classList.add("collapsed");
