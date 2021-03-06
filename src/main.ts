import Vue from 'vue';
import App from './App.vue';

import 'normalize.css';
import './../styles/styles.scss';
import numbro from 'numbro';

import './string-extensions';

Vue.config.productionTip = false;

setFilters();

import { library } from '@fortawesome/fontawesome-svg-core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { faChevronCircleDown } from '@fortawesome/free-solid-svg-icons';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { faMoon } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faGithub, faCloudUploadAlt, faChevronCircleDown, faExclamationCircle, faSun, faMoon);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('sql-string', () => import('@/components/operations/SqlString.vue'));

new Vue({
  render: (h) => h(App),
}).$mount('#app');

function setFilters() {
  Vue.filter('filterBytes', function(value: number) {
    return numbro(value).format(
      {
        output: 'byte',
        base: 'general',
        mantissa: 1,
      });
  });

  Vue.filter('filterKiloBytes', function(value: number) {
    return numbro(value * 1024).format(
      {
        output: 'byte',
        base: 'general',
        mantissa: 1,
      });
  });

  Vue.filter('filterSigfig', function(value: number) {
    return numbro(value).format('0[.]0000');
  });

  Vue.filter('filterPercent', function(value: number) {
    return numbro(value).format({ output: 'percent', mantissa: 0 });
  });

  Vue.filter('filterInteger', function(value: number) {
    return numbro(value).format('0,0');
  });

  Vue.filter('stripBrackets', function(value: string) {
    return value.split('[').join('').split(']').join('');
  });

  Vue.filter('ordinal', function(value: number) {
    return numbro(value).format({ output: 'ordinal' });
  });

  Vue.filter('maxLength', function(value: string, maxLength: number = 30) {

    if (value.length < maxLength) {
      return value;
    }

    return value.substring(0, maxLength) + '...';
  });
}
