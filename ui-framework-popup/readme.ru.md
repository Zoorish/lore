Сейчас мы рассмотрим, как создавать всплывающие и перекрывающие элементы на React, Angular 1.5 и Angular 2.
Реализуем создание и показ модального окна на каждом из фреймворков.

Весь код в статье написан на typescript. 
Исходный код примеров доступен [на github](https://github.com/rd-dev-ukraine/lore/tree/master/ui-framework-popup)

# Введение 

Что такое "всплывающие и перекрывающие" элементы? 
Это DOM элементы, которые показываются поверх основного содержимого документа.

Это различные всплывающие окна (в том числе модальные), выпадающие списки и менюшки, панельки для выбора даты и так далее.

Как правило, для таких элементов применяют абсолютное позиционирование в координатах окна (для модальных окон) при помощи `position: fixed`,
или абсолютное позиционирование в координатах документа - 
для меню, выпадающих списков, которые должны располагаться возле своих "родительских" элементов, - при помощи `position: absolute`.
 

Простое размещение всплывающих элеменов возле "родителей" и скрытие/отображение их не работают полностью.
Причина - это родительские контейнеры с `overflow`, отличным от `visible` (и `fixed`). 
Все, что выступает за границы контейнера, будет обрезано. 
Также такие элементы могут перекрываться элементами ниже по дереву, и z-index не всегда тут поможет,
так как работает только в пределах одного [контекста наложения](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).

По-хорошему, эту проблему элегантно мог бы решить Shadow DOM (и то, не факт), но пока он не готов.
Могло бы помочь CSS свойство, запрещающее обрезку и перекрытие, 
либо позиционирование относительно документа (а не родителя), но его нет. 
Поэтому используем костыль - DOM элементы для всплывающих компонентов помещаем в `body`, 
ну или, на худой конец, поближе к нему, в специальный контейнер, у родителей которого заведомо нет "обрезающих" стилей.

Замечание: мы не будем рассматривать позиционирование элементов с разными координатами и родителями - это отдельная сложная тема, 
полная костылями, javascript-ом и обработкой неожиданных событий браузера.

Например, ни один из существующих способов не решает идеально проблему позиционирования,
если нам нужно сделать компонент типа `select` или autocomplete с выпадающим списком возле элемента.

Использование `position: fixed`, по-видимому, позволяет избежать обрезки родительским контейнером,
но вынуждает обрабатывать скроллинг документа и контейнера (проще всего тупо закрывать выпадающий список).
Использование `position: absolute` и помещение элемента в `body` обрабатывает прокрутку документа правильно, 
но требует пересчета позиции при прокрутке контейнера.
Все способы требуют обработки события resize.
В общем, нет тут хорошего решения.

# Примеры 

Все примеры содержат одинаковую верстку, и состоят из поля ввода с текстом и кнопки.
По нажатию на кнопку введенный текст появляется в "модальном" окошке с кнопкой "Закрыть".

Все примеры написаны на typescript.
Для компиляции и бандлинга используется webpack.
Чтобы запустить примеры, у вас должен быть установлен NodeJS.

Для запуска перейдите в папку с соответствующим примером и выполните в командной строке NodeJS один раз `npm run prepare`, 
чтобы установить глобальные и локальные пакеты. 
Потом выполните `npm run server`.
После этого откройте в браузере адрес [http://localhost:8080](http://localhost:8080)

Если это делать лень, можно просто открыть в браузере `index.html` из папки соответствующего примера.

# Angular 1.5

## Компоненты

В версии 1.5 Angular приобрел синтаксический сахар в виде метода `component` у модуля, который позволяет объявлять компоненты. 
Компоненты - это на самом деле директивы, но код их объявления ориентирован на создание 
кирпичиков предметной области приложения, тогда как директивы больше ориентированы 
(идеологически, технически все идентично) на низкоуровневую и императивную работу с DOM.
Это нововведение простое, но прикольное, и позволяет объявлять компоненты способом, схожим с Angular 2.
Никаких новых фич этот способ не привносит, 
но может кардинально повлиять на структуру приложения, особенно, 
если раньше вы пользовались `<div ng-controller="MyController as $c">...</div>`.

От себя я могу добавить, что я в восторге от этой возможности. 
Она позволяет создавать компоненты с четким контрактом и высоким потенциалом для повторного использования.
Более того, с этой возможностью я отказался от вынесения HTML разметки компонента в отдельный файл, 
т.к. разметка получается маленькая и аккуратная - в ней используются вложенные компоненты - 
и не загромождает исходник компонента. 

В примере я тоже использую эту возможность, поэтому, если вы еще не знакомы с ней, 
почитать можно [здесь](https://docs.angularjs.org/guide/component).

## Два способа

Наверное, существует больше способов поместить компонент в произвольное место DOM. 
Я покажу два из них, один при помощи сервиса `$compile`, второй - при помощи директивы с `transclude`.

Первый способ императивный, и подходит больше для ad-hoc показа модальных окон, 
например, для вывода сообщений или запроса у пользователя каких-то параметров.
Также этот способ можно применять, если тип компонента неизвестен, или разметка динамическая.

Второй способ - декларативный, он позволяет встроить всплывающий элемент в шаблон компонента,
но при показе помещать его в `body`. 
Подходит для компонентов типа дроп-дауна, позволяя реактивно управлять видимостью. 
    

## Способ 1: $compile

Сервис `$compile` позволяет преобразовать строку с Angular разметкой в DOM элемент и связать его со `$scope`.
Получившийся элемент может быть добавлен в произвольное место документа.
Все довольно просто.

Вот [документация](https://docs.angularjs.org/api/ng/service/$compile) сервиса. 
По ссылке полное руководство по API директив, интересующая нас часть в самом конце - использование `$compile` как функции.

Получаем доступ к `$compile`

``` typescript
// popup.service.ts
import * as angular from "angular";

export class PopupService {
    static $inject = ["$compile"];

    constructor(private $compile: angular.ICompileService) {}
}

```

Объявление `static $inject=["$compile"]` эквивалентно следующему Javascript коду:

``` javascript
function PopupService($compile) {
    this.$compile = $compile;
} 

PopupService.$inject = ["$compile"];
```

`$compile` работает в две фазы.
На первой он преобразует строку в функцию-фабрику.
На второй нужно вызвать полученную фабрику и передать ей `$scope`.
Фабрика вернет DOM элементы, связанные с этим $scope.

`$compile` принимает три аргумента, нас интересует только первый.
Первый аргумент - это строка, содержащая HTML шаблон, который будет потом преобразован в работающий фрагмент Angular приложения.
В шаблоне можно использовать любые зарегистрированные компоненты из вашего модуля и его зависимостей,
а также любые валидные конструкции Angular - директивы, интерполяцию строк и т.п.

Результатом компиляции будет фабрика - функция, которая позволит связать строковый шаблон с любым `$scope`.
Таким образом, задавая шаблон, можно использовать любые поля и методы вашего скоупа.
Например, вот как выглядит код открытия всплывающего окна:

``` typescript
/// test-popup.component.ts

export class TestPopupComponentController {
    static $inject = ["$scope", PopupService.Name];

    text: string = "Open popup with this text";

    constructor(
        private $scope: angular.IScope,
        private popupService: PopupService) {
    }

    openPopup() {
        const template = `<popup-content text="$c.text" ...></popup-content> `
        this.popupService.open(template)(this.$scope);
    }
}

```

Обратите внимание на несколько вещей. 
Во-первых, шаблон содержит компонент `<popup-content></popup-content>`.
Во-вторых, шаблон содержит обращение к полю `text` контроллера: `text="$c.text"`.
`$c` - это алиас контроллера, заданный при объявлении компонента.

`PopupService.open` также возвращает фабрику, позволяющую связать шаблон со `$scope`.
Для того, чтобы связать динамический компонент со `$scope` нашего компонента, 
приходится передавать `$scope` в контроллер.

Вот как выглядит `PopupService.open`:

``` typescript
// popup.service.ts

open(popupContentTemplate: string): ($scope: angular.IScope) => () => void {
    const content = `
            <div class="popup-overlay">
                ${popupContentTemplate}
            </div>
            `;

    return ($scope: angular.IScope) => {
        const element = this.$compile(content)($scope);
        const popupElement = document.body.appendChild(element[0]);

        return () => {
            body.removeChild(popupElement);
        };
    };
}

```

В нашей функции мы оборачиваем переданный шаблон в разметку модального окна.
Потом компилируем шаблон, получая фабрику динамических компонентов.
Потом вызываем полученную фабрику, передавая `$scope`, и получаем HTML элемент,
который представляет собой полностью рабочий фрагмент Angular приложения, связанный с переданным `$scope`.
Теперь его можно добавить в любое место документа.

Хотя наш метод `PopupService.open` тоже возвращает фабрику для связи с `$scope`, он делает дополнительную работу.
Во-первых, когда фабрика вызывается, он не только создает элемент, но и добавляет его в `body`.
Во-вторых, он создает функцию, которая позволит "закрыть" поп-ап окно, удалив его из документа.
`PopupService.open` возвращает эту функцию для закрытия окна.

Что ж, вариант не так плох. 
Хотя само отображение окна императивное, тем не менее, содержимое окна все еще реактивно, 
и может быть декларативно связано с родительским `$scope`.
Хотя для отображения контента приходится использовать строки, но если сам контент окна сделать в виде компонента,
то связывать нужно будет только input и output свойства, а не весь контент.
Метод позволяет поместить поп-ап элемент в любое место документа, даже если оно вне `ng-app`.

## Способ 2: Директива с transclude

Второй способ позволяет задавать содержимое всплывающего элемента прямо возле его "родителя".
При показе элемент будет на самом деле добавлен в `body`.

``` html
<div>
    <div class="form-group">
        <label>
            Enter text to display in popup:
        </label>
        <input class="form-control" ng-model="$c.text" type="text" />
    </div>
    <p>
        <button class="btn btn-default" 
                ng-click="$c.openInlinePopup()">
            Open inline 
        </button>
    </p>
    <!-- Вот это будет в body -->
    <popup ng-if="$c.popupVisible">
        <popup-content text="$c.text" close="$c.closeInlinePopup()">
        </popup-content>
    </popup>
</div>

``` 

Здесь искомая директива - `<popup>...</popup>`. 
Все, что внутри нее, будет показано во всплывающем окне, и расположено в `body`.

Небольшой недостаток этого метода в том, что показывать и прятать окно необходимо при помощи директивы `ng-if`,
которая физически будет убирать/добавлять содержимое в DOM дерево.

### transclude

`transclude` - это способ директив работать со своим содержимым. 
Под содержимым понимается то, что расположено между открывающимся и закрывающимся тегами директивы.

``` html
<my-directive>
    <!-- Все, что внутри my-directive, это содержимое -->
    <div class="">
        <other-component>...</other-component>
    </div>
</my-directive>
``` 

Это очень мощная возможность, на основе которой можно сделать много интересного.
Мы же будем брать содержимое и помещать его в `body`.

Как использовать `transclude`?
Напрямую использовать контент (например, через `$element.children`) нельзя - он не связан с правильным scope, 
и не скомпилирован (не заменены директивы и т.д.). 
Для использования `transclude` нужно получить доступ к т.н. `transclude function`.
Это фабрика, которая умеет создавать скомпилированные копии (клоны) содержимого.
Эти клоны будут скомпилированы и связаны с правильным scope, и вообще, очень похожи на результат работы `$compile`. 
Transclude function, однако, не возвращает значение, как обычная фабрика, а передает его в коллбек-функцию.

Можно создавать сколько угодно клонов, переопределять им scope, добавлять в любое место документа, и так далее.
Здорово.

Для директив, которые сами управляют содержимым (вызывают transclude function), 
необходимо реализовывать lifecycle методы для очистки содержимого. 
Эти методы реализуются в контроллере директивы. 
Удалять добавленное содержимое нужно в `$onDestroy`.

Осталось последнее - как получить доступ к transclude function. 
Она передается в нескольких местах, но мы ее заинжектим в контроллер.
Для того, чтобы она передалась, в конфигурации директивы должно быть установлено `transclude: true`.

Итак, полный код:

``` typescript
import * as angular from "angular";

export class PopupDirectiveController {
    private content: Node;

    constructor(private transclude: angular.ITranscludeFunction) {
    }

    $onInit() {
        this.transclude(clone => {            
            const popup = document.createElement("div");
            popup.className = "popup-overlay";
            for(let i = 0; i < clone.length; i++) {
                popup.appendChild(clone[i]);
            }

            this.content = document.body.appendChild(popup);
        });
    }

    $onDestroy() {
        if (this.content) {
            document.body.removeChild(this.content)
            this.content = null;
        }
    }
}

export const name = "popup";

export const configuration: angular.IDirective = {
    controller: ["$transclude", PopupDirectiveController],
    replace: true,
    restrict: "E",
    transclude: true
};
```

Неплохо, всего 36 строк.

Преимущества:
* Полностью реактивное отображение и скрытие, реактивное содержимое
* Удобно разносит "виртуальное" расположение в дереве компонентов и "физическое" расположение в DOM дереве.
* Декларативно привязано к текущему scope.

Недостатки:
* В этом варианте реализации нужно использовать `ng-if` для управления отображением.
 

# Angular 2

Новая версия Angular, отличающаяся от первого настолько, что, фактически, это новый продукт.
Мои впечатления от него двоякие.

С одной стороны, код компонентов несомненно чище и яснее. 
При написании бизнес-компонентов разделение кода и представления отличное, 
change tracking работает прекрасно, прощайте `$watch` и `$apply`, 
прекрасные средства для описания контракта компонента.

С другой стороны, не оставляет ощущение монструозности. 
[5 min quickstart](https://angular.io/docs/ts/latest/quickstart.html) выглядит издевательством.
Множество дополнительных библиотек, многие из которых обязательны к использованию (как `rxjs`).
То, что я успеваю увидеть надпись **Loading...** при открытии документа *с файловой системы*, вселяет сомнения в его скорости.
Размер бандла в 4.3MB против 1.3MB у Angular 1 и 700KB React (правда, это без оптимизаций, дефолтный бандлинг webpack-а).
(Напоминаю, что webpack собирает (бандлит) весь код приложения и его зависимостей (из npm) в один большой javascript файл).

Минифицированный размер: Angular 1 - 156KB, Angular 2 - около 630KB, в зависимости от варианта, React - 150KB.  

Angular 2 на момент написания еще RC. 
Код практически готов, багов вроде бы нет, основые вещи сделаны (ну кроме разве что переделки форм).
Однако документация неполная, многие вещи приходится искать в комментариях к github issue 
(как, например, динамическая загрузка компонентов, что, собственно, и подтолкнуло меня к написанию этой статьи).

## Disclaimer

Тратить полтора часа на шаги, описанные в упомянутом 5 min quickstart, не хотелось, 
поэтому проект сконфигурирован не совсем, кхм, традиционно для Angular 2.
SystemJS не используется, вместо этого бандлится webpack-ом.
Причем Angular 2 не указывается как externals, а берется из npm пакета как есть.
В результате получается гигантский бандл в 4.5MB весом.
Поэтому не используйте эту конфигурацию в продакшене, 
если, конечно, не хотите, чтобы пользователи возненавидели ваш индикатор загрузки.
Вторая странность, которая не знаю, чем вызвана, это отличающиеся названия модулей.
Во всех примерах (в том числе в официальной документации) импорт Angular выглядит как ` import { } from "@angular/core"`.
В то же время, у меня так не заработало, а работает `import {} from "angular2/core"`.


## Динамическая загрузка 

К чести Angular 2, код динамической загрузки вызывает трудности только при поиске.
Для динамической загрузки используется класс [ComponentResolver](https://angular.io/docs/ts/latest/api/core/index/ComponentResolver-class.html) в сочетании с [ViewContainerRef](https://angular.io/docs/ts/latest/api/core/index/ViewContainerRef-class.html).

``` typescript

// Асинхронно создает новый компонент по типу.
// Тип - это класс компонена (его функция-конструктор)
 loadComponentDynamically(componentType: Type, container: ViewContainerRef) {
    this.componentResolve
        .resolveComponent(componentType)
        .then(factory => container.createComponent(factory))
        .then(componentRef => {
            // Получаем доступ к экземпляру класса компонента
            componentRef.instance;
            // Получаем доступ ElementRef контейнера, в который помещен компонент
            componentRef.location;
            // Получаем доступ к DOM элементу. 
            componentRef.location.nativeElement;
            // Удаляем компонент
            componentRef.destroy();
        });
 }
```

`ComponentResolver` легко получить через dependency injection. 
`ViewContainerRef`, по-видимому, не может быть создан для произвольного DOM элемента, 
и может быть только получен для существующего Angular компонента.
Это значит, что поместить динамически созданный элемент в произвольное место DOM дерева *невозможно*,
по крайней мере, в релиз-кандидате.

Поэтому, наш механизм для показа поп-апов будет составным. 

Во-первых, у нас будет компонент, в который будут динамически добавляться поп-ап элементы.
Его нужно будет разместить где-нибудь в дереве компонентов, желательно поближе к корневому элементу.
Кроме того, никакой из его родительских контейнеров не должен содержать стилей, обрезающих содержимое.
В коде это `overlay-host.component.ts`. 

Во-вторых, у нас есть вспомогательный компонент, содержащий в себе разметку для поп-ап окна.
Это `OverlayComponent`, в который оборачивается динамически создаваемый компонент.

В-третьих, у нас есть сервис, который обеспечивает связь между хост-компонентом для поп-апов и
клиентами, которые хотят показывать компонент. 
Сервис достаточно простой, хост-компонент регистрирует себя в нем при создании, 
и метод сервиса просто перенаправляет вызовы открытия окна этому хост-компоненту.

## Хост-компонент

Я приведу класс целиком, он не очень большой, и потом пройдусь по тонким местам:

``` typescript
import { Component, ComponentRef, ComponentResolver, OnInit, Type, ViewChild, ViewContainerRef } from "angular2/core";

import { OverlayComponent } from "./overlay.component";
import { IOverlayHost, OverlayService } from "./overlay.service";

@Component({
    selector: "overlay-host",
    template: "<template #container></template>"
})
export class OverlayHostComponent implements IOverlayHost, OnInit {

    @ViewChild("container", { read: ViewContainerRef }) container: ViewContainerRef;

    constructor(
        private overlayService: OverlayService,
        private componentResolver: ComponentResolver) {
    }

    openComponentInPopup<T>(componentType: Type): Promise<ComponentRef> {
        return this.componentResolver
            .resolveComponent(OverlayComponent)
            .then(factory => this.container.createComponent(factory))
            .then((overlayRef: ComponentRef) => {

                return overlayRef.instance
                    .addComponent(componentType)
                    .then(result => {

                        result.onDestroy(() => {
                            overlayRef.destroy();
                        });

                        return result;
                    });
            });
    }

    ngOnInit(): void {
        this.overlayService.registerHost(this);
    }
}
```

Что делает этот код? 
Он динамически создает компонент, используя его тип (тип компонента - это его функция-конструктор).
Предварительно создается компонент-обертка (`OverlayComponent`), наш запрошенный компонент добавляется уже к нему.
Также мы подписываемся на событие `destroy`, чтобы уничтожить обертку при уничтожении компонента. 

Первое, на что нужно обратить внимание, это как получается `ViewContainerRef` при помощи запроса к содержимому.
Декоратор `@ViewChild()` позволяет получать `ViewContainerRef` по имени template variable `template: <template #container></template>`.
`#container` - это и есть template variable, переменная шаблона. 
К ней можно обращаться по имени, но только в самом шаблоне.
Чтобы получить доступ к ней из класса компонента, используется упомянутый декоратор. 

Честно говоря, я это нагуглил, и как по мне, это вообще неинтуитивно.
Это одна из особенностей второго Angular-а, которая мне очень сильно бросилась в глаза, - 
в документации очень сложно, или же вообще невозможно, найти решения для типовых задач низкоуровневой разработки директив.
Документация для создания именно бизнес-компонентов нормальная, да и ничего там особо сложного нет.
Однако для сценариев написания контролов, низкоуровневых компонентов, невозможно найти документации.
Динамическое создание компонентов, взаимодействие с шаблоном из класса - эти области просто не документированы.
Даже в описании [@ViewChild](https://angular.io/docs/ts/latest/api/core/index/ViewChild-var.html) ничего не сказано
о втором параметре.
Что ж, надеюсь, к релизу задокументируют.

Код `OverlayHostComponent`, который я привел выше, - это самое интересное в нашем примере. 
`OverlayComponent` содержит похожий код для динамического добавления содержимого, 
`OverlayService` перенаправляет вызовы открытия поп-апа к хост-компоненту.
Я не привожу листинги по причине тривиальности, если интересно, посмотрите в исходниках.

Посмотрим теперь, как этим пользоваться:

``` typescript
import { Component, Input } from "angular2/core";

import { OverlayService } from "./overlay";
import { PopupContent } from "./popup-content.component";

@Component({
    selector: "test-popup",
    template: `
    <div>
        <div class="form-group">
            <label>
                Enter text to display in popup:
            </label>
            <input class="form-control" [(ngModel)]="text" type="text" />
        </div>
        <p>
            <button class="btn btn-primary" 
                    (click)="openPopup()">
                Open popup
            </button>
        </p>                
    </div>    
    `
})
export class TestPopup {
    text: string = "Show me in popup";

    constructor(private overlayService: OverlayService) {
    }

    openPopup() {
        this.overlayService
            .openComponentInPopup(PopupContent)
            .then(c => {
                const popup: PopupContent = c.instance;
                popup.text = this.text;
                popup.close.subscribe(n => {
                    c.destroy();
                });
            });
    }
}
```  

`OverlayService` указан в providers `Root` компонента, в нашем компоненте его регистрировать не нужно.

После создания экземпляра компонента можно получить к нему доступ через `ComponentRef.instance`.

Потом начинается страшная императивщина: устанавливаем свойства компонента, подписываемся на события, все это руками.
Ни о какой декларативности или реактивности речи не идет. 
Особенно весело, если нужно обеспечить двухстороннее связывание.
Несколько вариантов с бесконечными циклами и флагами `isRunning` вам обеспечены.

## Вывод

Честно говоря, это выглядит ужасно.
Я искренне надеюсь, что я искал недостаточно хорошо, и где-то есть красивый способ, 
позволяющий разместить компонент в произвольном месте DOM дерева,
и нормально связать свойства динамически созданного компонента с родителем.

Я долго рассматривал [исходник ngFor](https://github.com/angular/angular/blob/master/modules/%40angular/common/src/directives/ng_for.ts),
но не смог решить проблему связывания. 
Я думал над фабрикой компонентов с динамическими шаблонами, 
но не уверен, что существует способ динамической регистрации компонентов в массиве `directives`.

Отсутствие способа помещать компоненты в произвольное место DOM это не очень хорошо, и может вносить ограничения,
особенно если страница это несколько микро-приложений.
Однако отсутствие динамического связывания компонентов это, на мой взгляд, гораздо более серьезная проблема.


# ReactJS

В Реакте стандартный способ отображения компонента в DOM дерево - это метод `render`, 
который возвращает виртуальный узел виртуального DOM.
Однако, это совсем не значит, что этот способ единственный.
Для вставки компонента в произвольное место из метода `render` возвращается `null`,
и перехватываются lifecycle-методы `componentDidMount`, `componentWillUnmount`, `componentDidUpdate`.
В `componentDidMount` и `componentDidUpdate`, используя `ReactDOM.render`, можно отрендерить содержимое в любое место.
В `componentWillUnmount` содержимое, соответственно, уничтожается.

Собственно, код:

``` typescript
import * as React from "react";
import * as ReactDOM from "react-dom";

export class Popup extends React.Component<{}, {}> {
    popup: HTMLElement;

    constructor() {
        super();
    }

    render() {
        return (<noscript></noscript>);
    }

    componentDidMount() {
        this.renderPopup();
    }

    componentDidUpdate() {
        this.renderPopup();
    }

    componentWillUnmount() {
        ReactDOM.unmountComponentAtNode(this.popup);
        document.body.removeChild(this.popup);
    }
    
    renderPopup() {
        if (!this.popup) {
            this.popup = document.createElement("div");
            document.body.appendChild(this.popup);
        }

        ReactDOM.render(
            <div className="popup-overlay">
                <div className="popup-content">
                    { this.props.children }
                </div>
            </div>,
            this.popup);
    }
}

```


Все просто и понятно. 
Видно, что такой сценарий создателями Реакта продумывался.

Вообще Реакт после Angular производит очень приятное впечатление. 
Отсутствуют костыли отслеживания изменений, которые вроде бы не нужно использовать, но всегда приходится.
Простой доступ к DOM элементам, если он нужен. 
Простой доступ к содержимому реакт-элемента через `children`, причем это не строка и не HTMLElement, 
а структура, содержащая в себе полноценные реакт-элементы (для работы с ними нужно использовать `React.Children`).

Ладно, теперь посмотрим, как это использовать. Привожу, для краткости, только метод `render`:

``` typescript
render() {
        return (
            <div>
                <div className="form-group">
                    <label>
                        Enter text to display in popup:
                    </label>
                    <input className="form-control"
                        value={ this.state.text }
                        onChange={ e => this.setText(e.target.value) }
                        type="text" />
                </div>
                <p>
                    <button className="btn btn-primary" onClick={e => this.openPopup() } type="button" >
                        Open popup
                    </button>
                </p>

                <Ifc condition={ () => this.state.isPopupVisible } >
                    <Popup>
                        <div className="alert alert-success">
                            <h2>
                                { this.state.text}
                            </h2>
                            <button className="btn btn-warning" onClick={e => this.closePopup() } type="button" >
                                Close popup
                            </button>
                        </div>
                    </Popup>
                </Ifc>
            </div>
        )
    }
``` 

`Ifc` это костылик, который рендерит содержимое, только если `condition` истинно.
Это позволяет избавиться от монструозных IIFE, если нужно отрендерить кусок компонента по условию.

В остальном все просто: если компонент `<Popup></Popup>` есть в виртуальном дереве - поп-ап окошко показывается,
если нет - то прячется.
При этом физически в DOM дереве оно находится в `body`.

Как видим, очень похоже на второй способ с Angular 1.5, с директивой.

## Итоги

В принципе, поп-ап в Реакте можно сделать и императивным способом, похожим на способ Angular с `$compile`.
Это может упростить некоторые сценарии и не создавать флаг в состоянии приложения для показа каждого алерта.
Принцип тот же (используя `ReactDOM.render`), но только не в методах жизненного цикла компонента, а в методе `openPopup`.
Это, конечно же, нарушает реактивность, но сделает код понятнее, увеличив связность.

Недостатки приведенного способа - не будет работать в серверном рендеринге.


# Заключение

Подходы, изначально заложенные в Реакте - однонаправленные потоки данных, компоненты, четкий input/output контракт компонента - 
нашли свое отражение и в Angular: by design в Angular 2, и в обновлениях Angular 1.5. 
Это изменение без сомнения пошло на пользу первому Angular.  

Что касается показа всплывающих элементов - это пример костылей, которые возникли из-за несовершенства CSS, 
но повлияли на всю экосистему веб-разработки.
Это яркий пример текущей абстракции, а также баланса между "чистой архитектурой" и "реальной жизнью" веб разработки.
Как видим, разработчики Angular 2 либо не задумывались об этом сценарии, либо реализовали его, но никому не сказали.
В то же время, первый Angular и React достаточно гибкие (а разработчики Реакта видимо еще и продуманные),
чтобы можно было реализовать рендеринг элемента в отличное от его расположения в дереве компонентов.  