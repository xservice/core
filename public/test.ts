import Monitor from '../src/index';
const createServer = Monitor({
  prefix: '/api',
  event: 'hashchange',
  error(e, ctx) {
    console.log(ctx, e)
  },
  start(ctx) {
    console.log('start', ctx.path)
  },
  stop(ctx) {
    console.log('stop', ctx.path)
  }
});


let installed = false;
let divs: HTMLElement;
createServer(async (ctx) => {
  if (!installed) {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.innerHTML = ctx.req.pathname;
    div.addEventListener('click', () => {
      console.log('click')
      ctx.redirect('/abc');
      // ctx.post('/test').then(console.log)
    });
    installed = true;
    divs = div;
  }
  if (ctx.path === '/abc') {
    ctx.redirect('/def')
  } 
  else if (ctx.path === '/def') {
    console.log('in def');
  }
  else if (ctx.path === '/test') {
    ctx.body = {
      a:1
    }
  } else {
    divs.innerHTML = ctx.req.pathname
    // console.log(ctx);
  }
}).listen({
  '/': '/abc'
});