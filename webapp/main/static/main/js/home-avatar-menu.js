(function () {
    function parseHomeProps() {
        var propsNode = document.getElementById("home-app-props");
        if (!propsNode) {
            return null;
        }

        try {
            return JSON.parse(propsNode.textContent || "{}");
        } catch (error) {
            return null;
        }
    }

    function buildHomeViewUrl(homeUrl, view, hash) {
        var url = new URL(homeUrl || window.location.pathname, window.location.origin);

        url.searchParams.delete("view");
        url.searchParams.delete("tutor");

        if (view) {
            url.searchParams.set("view", view);
        }

        url.hash = hash ? "#" + hash : "";
        return url.pathname + url.search + url.hash;
    }

    function createMenuItem(options) {
        var element = document.createElement(options.type === "button" ? "button" : "a");
        element.className = "quick-actions__menu-item" + (options.logout ? " quick-actions__menu-item--logout" : "");

        if (options.type === "button") {
            element.type = "button";
        } else {
            element.href = options.href;
        }

        var icon = document.createElement("span");
        icon.className = "quick-actions__menu-icon";
        icon.setAttribute("aria-hidden", "true");

        var iconInner = document.createElement("i");
        iconInner.className = options.icon;
        icon.appendChild(iconInner);

        var label = document.createElement("span");
        label.textContent = options.label;

        element.appendChild(icon);
        element.appendChild(label);
        return element;
    }

    function enhanceAvatarMenu(root, props) {
        var account = root.querySelector(".quick-actions__account");
        var avatar = account ? account.querySelector(".quick-actions__user") : null;
        var logoutForm = account ? account.querySelector(".quick-actions__form") : null;

        if (!account || !avatar || !logoutForm || account.dataset.avatarMenuReady === "true") {
            return false;
        }

        var currentUser = props.currentUser || {};
        var urls = props.urls || {};
        var displayName = currentUser.displayName || currentUser.username || "Uzytkownik";
        var homeUrl = urls.home || window.location.pathname;

        account.dataset.avatarMenuReady = "true";
        account.classList.add("is-menu-ready");

        var trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "quick-actions__user quick-actions__user-trigger";
        trigger.title = "Profil " + displayName;
        trigger.setAttribute("aria-label", "Otworz menu profilu");
        trigger.setAttribute("aria-haspopup", "menu");
        trigger.setAttribute("aria-expanded", "false");

        avatar.replaceWith(trigger);

        var menu = document.createElement("div");
        menu.className = "quick-actions__menu";
        menu.hidden = true;

        var heading = document.createElement("p");
        heading.className = "quick-actions__menu-heading";
        heading.textContent = displayName;
        menu.appendChild(heading);

        var list = document.createElement("div");
        list.className = "quick-actions__menu-list";

        var items = [
            {
                type: "link",
                label: "Moj profil",
                icon: "fa-regular fa-user",
                href: buildHomeViewUrl(homeUrl, "portal", "portal"),
            },
            {
                type: "link",
                label: "Panel korepetytora",
                icon: "fa-regular fa-rectangle-list",
                href: currentUser.isTutor
                    ? buildHomeViewUrl(homeUrl, "tutor-dashboard", "tutor-dashboard")
                    : (urls.onboarding || homeUrl),
            },
            {
                type: "link",
                label: "Ustawienia strony",
                icon: "fa-solid fa-gear",
                href: urls.onboarding || homeUrl,
            },
            {
                type: "link",
                label: "Wiecej o Rent a Nerd",
                icon: "fa-regular fa-circle-question",
                href: urls.about || homeUrl,
            },
        ];

        items.forEach(function (itemConfig) {
            var item = createMenuItem(itemConfig);
            item.addEventListener("click", function () {
                closeMenu();
            });
            list.appendChild(item);
        });

        var logoutItem = createMenuItem({
            type: "button",
            label: "Wyloguj mnie",
            icon: "fa-solid fa-arrow-right-from-bracket",
            logout: true,
        });
        logoutItem.addEventListener("click", function () {
            closeMenu();
            if (typeof logoutForm.requestSubmit === "function") {
                logoutForm.requestSubmit();
                return;
            }
            logoutForm.submit();
        });
        list.appendChild(logoutItem);

        menu.appendChild(list);
        account.appendChild(menu);

        function openMenu() {
            account.classList.add("is-open");
            menu.hidden = false;
            trigger.setAttribute("aria-expanded", "true");
        }

        function closeMenu() {
            account.classList.remove("is-open");
            menu.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
        }

        trigger.addEventListener("click", function (event) {
            event.stopPropagation();
            if (menu.hidden) {
                openMenu();
            } else {
                closeMenu();
            }
        });

        document.addEventListener("pointerdown", function (event) {
            if (!account.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        return true;
    }

    function initAvatarMenu() {
        var props = parseHomeProps();
        var root = document.getElementById("home-app");

        if (!props || !props.isAuthenticated || !props.currentUser || !root) {
            return;
        }

        if (enhanceAvatarMenu(root, props)) {
            return;
        }

        var observer = new MutationObserver(function () {
            if (enhanceAvatarMenu(root, props)) {
                observer.disconnect();
            }
        });

        observer.observe(root, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAvatarMenu, { once: true });
    } else {
        initAvatarMenu();
    }
})();
