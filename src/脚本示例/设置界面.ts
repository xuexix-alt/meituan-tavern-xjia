<<<<<<< HEAD
=======
import { createScriptIdDiv, destroyScriptIdDiv, deteleportStyle, teleportStyle } from '@/util/script';
>>>>>>> 716752b8f21fc75a91a1604ff7eb277d5de3327e
import 界面 from './设置界面.vue';

const app = createApp(界面).use(createPinia());

$(() => {
  const $app = createScriptIdDiv();
  $('#extensions_settings2').append($app);
  teleportStyle();
  app.mount($app[0]);
});

$(window).on('pagehide', () => {
  app.unmount();
  deteleportStyle();
  destroyScriptIdDiv();
});
<<<<<<< HEAD

function teleportStyle() {
  if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) {
    return;
  }
  const $div = $(`<div>`).attr('script_id', getScriptId()).append($(`head > style`, document).clone());
  $('head').append($div);
}

function deteleportStyle() {
  $(`head > div[script_id="${getScriptId()}"]`).remove();
}

function createScriptIdDiv(): JQuery<HTMLDivElement> {
  return $('<div>').attr('script_id', getScriptId()) as JQuery<HTMLDivElement>;
}

function destroyScriptIdDiv(): void {
  $(`div[script_id="${getScriptId()}"]`).remove();
}
=======
>>>>>>> 716752b8f21fc75a91a1604ff7eb277d5de3327e
