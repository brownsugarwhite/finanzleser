(function() {
    const { registerBlockType } = wp.blocks;
    const { useState, useEffect } = wp.element;
    const { SelectControl, Placeholder, Spinner, TextControl, TextareaControl, Button } = wp.components;
    const { useBlockProps } = wp.blockEditor;
    const apiFetch = wp.apiFetch;
    // Für die Leo-Seitenleiste: Post-Meta lesen und schreiben, Beitragsinhalt beobachten.
    const useSelect = wp.data && wp.data.useSelect;
    const useEntityProp = wp.coreData && wp.coreData.useEntityProp;

    // SVG Icons (aus public/icons/)
    const rechnerIcon = wp.element.createElement('svg', {
        width: 24, height: 24, viewBox: '0 0 60.4 73.29', fill: 'none',
    },
        wp.element.createElement('rect', { x: 2.5, y: 2.5, width: 55.4, height: 68.29, rx: 7.94, ry: 7.94, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('rect', { x: 12.35, y: 11.44, width: 35.22, height: 15.88, rx: 2, ry: 2, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('line', { x1: 13.35, y1: 41.76, x2: 26.14, y2: 41.76, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10 }),
        wp.element.createElement('line', { x1: 34.78, y1: 55.88, x2: 47.57, y2: 55.88, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10 }),
        wp.element.createElement('line', { x1: 19.74, y1: 35.36, x2: 19.74, y2: 48.15, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10 }),
        wp.element.createElement('line', { x1: 19.82, y1: 58.41, x2: 40.58, y2: 37.65, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10 })
    );

    const checklisteIcon = wp.element.createElement('svg', {
        width: 24, height: 24, viewBox: '0 0 60.4 73.29', fill: 'none',
    },
        wp.element.createElement('rect', { x: 2.5, y: 2.5, width: 55.4, height: 68.29, rx: 2.8, ry: 2.8, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('rect', { x: 10.69, y: 11.44, width: 20.77, height: 20.77, rx: 2, ry: 2, stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('rect', { x: 10.69, y: 40.98, width: 20.77, height: 20.77, rx: 2, ry: 2, stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('line', { x1: 37.79, y1: 21.83, x2: 49.65, y2: 21.83, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10 }),
        wp.element.createElement('line', { x1: 37.79, y1: 51.36, x2: 49.65, y2: 51.36, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10 }),
        wp.element.createElement('polyline', { points: '15.21,20.83 19.44,25.33 25.94,16.18', stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('polyline', { points: '15.21,50.78 19.44,55.28 25.94,46.14', stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10, fill: 'none' })
    );

    const vergleichIcon = wp.element.createElement('svg', {
        width: 24, height: 24, viewBox: '0 0 60.4 73.29', fill: 'none',
    },
        wp.element.createElement('rect', { x: 2.5, y: 2.5, width: 55.4, height: 68.29, rx: 4, ry: 4, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('rect', { x: 12, y: 42, width: 8, height: 22, fill: '#45a117' }),
        wp.element.createElement('rect', { x: 26, y: 30, width: 8, height: 34, fill: '#45a117' }),
        wp.element.createElement('rect', { x: 40, y: 18, width: 8, height: 46, fill: '#45a117' })
    );

    // Typ-Labels für Rechner-Gruppierung
    var typLabels = {
        steuer: 'Steuern & Lohn',
        rente: 'Rente & Altersvorsorge',
        soziales: 'Soziales & Arbeit',
        kredit: 'Kredit & Finanzen',
    };

    // Typ-Labels für Vergleich-Gruppierung
    var vergleichTypLabels = {
        versicherung: 'Versicherungen',
        bank: 'Banken & Konten',
        energie: 'Energie',
        kredit: 'Kredit & Finanzen',
        sparen: 'Sparen & Anlage',
    };

    // Hilfsfunktion: save()-Output, identisch zu dem was in post_content steht
    function makeStaticSave(dataAttr) {
        return function(props) {
            var slug = props.attributes.slug;
            if (!slug) return null;
            var attrs = {};
            attrs[dataAttr] = slug;
            return wp.element.createElement('div', attrs);
        };
    }

    // ─── Rechner Block ───
    registerBlockType('finanzleser/rechner', {
        title: 'Finanzrechner',
        description: 'Einen interaktiven Finanzrechner einbetten',
        category: 'embed',
        icon: rechnerIcon,
        attributes: {
            slug: { type: 'string', default: '' },
        },

        edit: function(props) {
            var blockProps = useBlockProps();
            var slug = props.attributes.slug;
            var setAttributes = props.setAttributes;

            var _state = useState([]);
            var rechner = _state[0];
            var setRechner = _state[1];

            var _loading = useState(true);
            var loading = _loading[0];
            var setLoading = _loading[1];

            useEffect(function() {
                apiFetch({ path: '/finanzleser/v1/rechner' }).then(function(data) {
                    setRechner(data);
                    setLoading(false);
                });
            }, []);

            if (loading) {
                return wp.element.createElement('div', blockProps,
                    wp.element.createElement(Placeholder, {
                        icon: rechnerIcon,
                        label: 'Finanzrechner',
                    }, wp.element.createElement(Spinner))
                );
            }

            // Optionen gruppiert nach Typ
            var options = [{ label: '— Rechner auswählen —', value: '' }];
            var grouped = {};
            rechner.forEach(function(r) {
                var typ = r.typ || 'sonstige';
                if (!grouped[typ]) grouped[typ] = [];
                grouped[typ].push(r);
            });

            ['steuer', 'rente', 'soziales', 'kredit'].forEach(function(typ) {
                if (!grouped[typ]) return;
                options.push({ label: '── ' + (typLabels[typ] || typ) + ' ──', value: '', disabled: true });
                grouped[typ].forEach(function(r) {
                    options.push({ label: '  ' + r.title, value: r.slug });
                });
            });

            var selectedTitle = '';
            rechner.forEach(function(r) { if (r.slug === slug) selectedTitle = r.title; });

            if (slug && selectedTitle) {
                return wp.element.createElement('div', Object.assign({}, blockProps, {
                    style: { border: '2px solid #D3005E', borderRadius: 8, padding: 16, background: '#fef5f8' }
                }),
                    wp.element.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
                        rechnerIcon,
                        wp.element.createElement('strong', { style: { color: '#D3005E' } }, 'Finanzrechner')
                    ),
                    wp.element.createElement('p', { style: { margin: '0 0 8px', fontSize: 16, fontWeight: 600 } }, selectedTitle),
                    wp.element.createElement(SelectControl, {
                        value: slug,
                        options: options,
                        onChange: function(val) { setAttributes({ slug: val }); },
                    })
                );
            }

            return wp.element.createElement('div', blockProps,
                wp.element.createElement(Placeholder, {
                    icon: rechnerIcon,
                    label: 'Finanzrechner',
                    instructions: 'Wählen Sie einen Rechner aus:',
                },
                    wp.element.createElement(SelectControl, {
                        value: slug,
                        options: options,
                        onChange: function(val) { setAttributes({ slug: val }); },
                    })
                )
            );
        },

        save: makeStaticSave('data-finanzleser-rechner'),
    });

    // ─── Vergleich Block ───
    registerBlockType('finanzleser/vergleich', {
        title: 'Vergleich',
        description: 'Einen Vergleich einbetten',
        category: 'embed',
        icon: vergleichIcon,
        attributes: {
            slug: { type: 'string', default: '' },
        },

        edit: function(props) {
            var blockProps = useBlockProps();
            var slug = props.attributes.slug;
            var setAttributes = props.setAttributes;

            var _state = useState([]);
            var vergleiche = _state[0];
            var setVergleiche = _state[1];

            var _loading = useState(true);
            var loading = _loading[0];
            var setLoading = _loading[1];

            useEffect(function() {
                apiFetch({ path: '/finanzleser/v1/vergleiche' }).then(function(data) {
                    setVergleiche(data);
                    setLoading(false);
                });
            }, []);

            if (loading) {
                return wp.element.createElement('div', blockProps,
                    wp.element.createElement(Placeholder, {
                        icon: vergleichIcon,
                        label: 'Vergleich',
                    }, wp.element.createElement(Spinner))
                );
            }

            // Optionen: falls mind. ein Eintrag einen Typ hat, nach Typ gruppieren; sonst flache Liste.
            var options = [{ label: '— Vergleich auswählen —', value: '' }];
            var hasTyp = vergleiche.some(function(v) { return !!v.typ; });

            if (hasTyp) {
                var grouped = {};
                var untyped = [];
                vergleiche.forEach(function(v) {
                    if (v.typ) {
                        if (!grouped[v.typ]) grouped[v.typ] = [];
                        grouped[v.typ].push(v);
                    } else {
                        untyped.push(v);
                    }
                });
                Object.keys(grouped).sort().forEach(function(typ) {
                    options.push({ label: '── ' + (vergleichTypLabels[typ] || typ) + ' ──', value: '', disabled: true });
                    grouped[typ].forEach(function(v) {
                        options.push({ label: '  ' + v.title, value: v.slug });
                    });
                });
                if (untyped.length) {
                    options.push({ label: '── Sonstige ──', value: '', disabled: true });
                    untyped.forEach(function(v) {
                        options.push({ label: '  ' + v.title, value: v.slug });
                    });
                }
            } else {
                vergleiche.forEach(function(v) {
                    options.push({ label: v.title, value: v.slug });
                });
            }

            var selectedTitle = '';
            vergleiche.forEach(function(v) { if (v.slug === slug) selectedTitle = v.title; });

            if (slug && selectedTitle) {
                return wp.element.createElement('div', Object.assign({}, blockProps, {
                    style: { border: '2px solid #45A117', borderRadius: 8, padding: 16, background: '#f4faf0' }
                }),
                    wp.element.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
                        vergleichIcon,
                        wp.element.createElement('strong', { style: { color: '#45A117' } }, 'Vergleich')
                    ),
                    wp.element.createElement('p', { style: { margin: '0 0 8px', fontSize: 16, fontWeight: 600 } }, selectedTitle),
                    wp.element.createElement(SelectControl, {
                        value: slug,
                        options: options,
                        onChange: function(val) { setAttributes({ slug: val }); },
                    })
                );
            }

            return wp.element.createElement('div', blockProps,
                wp.element.createElement(Placeholder, {
                    icon: vergleichIcon,
                    label: 'Vergleich',
                    instructions: 'Wählen Sie einen Vergleich aus:',
                },
                    wp.element.createElement(SelectControl, {
                        value: slug,
                        options: options,
                        onChange: function(val) { setAttributes({ slug: val }); },
                    })
                )
            );
        },

        save: makeStaticSave('data-finanzleser-vergleich'),
    });

    // ─── Checkliste Block ───
    registerBlockType('finanzleser/checkliste', {
        title: 'Checkliste',
        description: 'Eine interaktive Checkliste einbetten',
        category: 'embed',
        icon: checklisteIcon,
        attributes: {
            slug: { type: 'string', default: '' },
        },

        edit: function(props) {
            var blockProps = useBlockProps();
            var slug = props.attributes.slug;
            var setAttributes = props.setAttributes;

            var _state = useState([]);
            var checklisten = _state[0];
            var setChecklisten = _state[1];

            var _loading = useState(true);
            var loading = _loading[0];
            var setLoading = _loading[1];

            useEffect(function() {
                apiFetch({ path: '/finanzleser/v1/checklisten' }).then(function(data) {
                    setChecklisten(data);
                    setLoading(false);
                });
            }, []);

            if (loading) {
                return wp.element.createElement('div', blockProps,
                    wp.element.createElement(Placeholder, {
                        icon: checklisteIcon,
                        label: 'Checkliste',
                    }, wp.element.createElement(Spinner))
                );
            }

            var options = [{ label: '— Checkliste auswählen —', value: '' }];
            checklisten.forEach(function(c) {
                options.push({ label: c.title, value: c.slug });
            });

            var selectedTitle = '';
            checklisten.forEach(function(c) { if (c.slug === slug) selectedTitle = c.title; });

            if (slug && selectedTitle) {
                return wp.element.createElement('div', Object.assign({}, blockProps, {
                    style: { border: '2px solid #BC38EC', borderRadius: 8, padding: 16, background: '#faf5fe' }
                }),
                    wp.element.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
                        checklisteIcon,
                        wp.element.createElement('strong', { style: { color: '#BC38EC' } }, 'Checkliste')
                    ),
                    wp.element.createElement('p', { style: { margin: '0 0 8px', fontSize: 16, fontWeight: 600 } }, selectedTitle),
                    wp.element.createElement(SelectControl, {
                        value: slug,
                        options: options,
                        onChange: function(val) { setAttributes({ slug: val }); },
                    })
                );
            }

            return wp.element.createElement('div', blockProps,
                wp.element.createElement(Placeholder, {
                    icon: checklisteIcon,
                    label: 'Checkliste',
                    instructions: 'Wählen Sie eine Checkliste aus:',
                },
                    wp.element.createElement(SelectControl, {
                        value: slug,
                        options: options,
                        onChange: function(val) { setAttributes({ slug: val }); },
                    })
                )
            );
        },

        // Dynamic block: die 202 bestehenden Checklisten sind self-closing
        // (<!-- wp:finanzleser/checkliste {"slug":"..."} /-->) ohne inneren Div.
        // Frontend-Ausgabe kommt aus render_callback im PHP.
        save: function() { return null; },
    });

    // ─── Dokumente Block (Mehrfachauswahl, bis zu 4) ───
    var dokumenteIcon = wp.element.createElement('svg', {
        width: 24, height: 24, viewBox: '0 0 60.4 73.29', fill: 'none',
    },
        wp.element.createElement('rect', { x: 10, y: 2.5, width: 47.9, height: 60, rx: 4, ry: 4, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('path', { d: 'M2.5,10.79 v60 h47.9', stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none', strokeLinejoin: 'round' }),
        wp.element.createElement('line', { x1: 20, y1: 18, x2: 48, y2: 18, stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10 }),
        wp.element.createElement('line', { x1: 20, y1: 30, x2: 48, y2: 30, stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10 }),
        wp.element.createElement('line', { x1: 20, y1: 42, x2: 40, y2: 42, stroke: '#45a117', strokeWidth: 4, strokeMiterlimit: 10 })
    );

    var DOK_MAX = 4;

    registerBlockType('finanzleser/dokumente', {
        title: 'Dokumente',
        description: 'Bis zu 4 Dokumente (PDF) einbetten',
        category: 'embed',
        icon: dokumenteIcon,
        attributes: {
            slugs: { type: 'array', default: [] },
        },

        edit: function(props) {
            var blockProps = useBlockProps();
            var slugs = props.attributes.slugs || [];
            var setAttributes = props.setAttributes;

            var _state = useState([]);
            var dokumente = _state[0];
            var setDokumente = _state[1];

            var _loading = useState(true);
            var loading = _loading[0];
            var setLoading = _loading[1];

            useEffect(function() {
                apiFetch({ path: '/finanzleser/v1/dokumente' }).then(function(data) {
                    setDokumente(data);
                    setLoading(false);
                });
            }, []);

            if (loading) {
                return wp.element.createElement('div', blockProps,
                    wp.element.createElement(Placeholder, {
                        icon: dokumenteIcon,
                        label: 'Dokumente',
                    }, wp.element.createElement(Spinner))
                );
            }

            // Optionen nach Kategorie (typ = Kategoriename) gruppieren.
            var options = [{ label: '— Dokument auswählen —', value: '' }];
            var hasTyp = dokumente.some(function(d) { return !!d.typ; });
            if (hasTyp) {
                var grouped = {};
                var untyped = [];
                dokumente.forEach(function(d) {
                    if (d.typ) {
                        if (!grouped[d.typ]) grouped[d.typ] = [];
                        grouped[d.typ].push(d);
                    } else {
                        untyped.push(d);
                    }
                });
                Object.keys(grouped).sort().forEach(function(typ) {
                    options.push({ label: '── ' + typ + ' ──', value: '', disabled: true });
                    grouped[typ].forEach(function(d) {
                        options.push({ label: '  ' + d.title, value: d.slug });
                    });
                });
                if (untyped.length) {
                    options.push({ label: '── Ohne Kategorie ──', value: '', disabled: true });
                    untyped.forEach(function(d) {
                        options.push({ label: '  ' + d.title, value: d.slug });
                    });
                }
            } else {
                dokumente.forEach(function(d) {
                    options.push({ label: d.title, value: d.slug });
                });
            }

            // Einen Auswahl-Slot setzen; leere Slots werden entfernt, Reihenfolge bleibt.
            function setSlot(index, val) {
                var next = slugs.slice();
                if (val) {
                    next[index] = val;
                } else {
                    next.splice(index, 1);
                }
                next = next.filter(Boolean).slice(0, DOK_MAX);
                setAttributes({ slugs: next });
            }

            // Slots: alle gewählten + ein leerer Zusatz-Slot (bis max 4).
            var slotCount = Math.min(slugs.length + 1, DOK_MAX);
            var selects = [];
            for (var i = 0; i < slotCount; i++) {
                selects.push(wp.element.createElement(SelectControl, {
                    key: 'dok-slot-' + i,
                    label: 'Dokument ' + (i + 1),
                    value: slugs[i] || '',
                    options: options,
                    onChange: (function(idx) { return function(val) { setSlot(idx, val); }; })(i),
                }));
            }

            var hint = wp.element.createElement('p', { style: { margin: '4px 0 0', fontSize: 12, color: '#757575' } },
                slugs.length + ' / ' + DOK_MAX + ' Dokument(en) ausgewählt');

            if (slugs.length > 0) {
                return wp.element.createElement('div', Object.assign({}, blockProps, {
                    style: { border: '2px solid #E07A5F', borderRadius: 8, padding: 16, background: '#fdf3ef' }
                }),
                    wp.element.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
                        dokumenteIcon,
                        wp.element.createElement('strong', { style: { color: '#C25A3F' } }, 'Dokumente')
                    ),
                    selects,
                    hint
                );
            }

            return wp.element.createElement('div', blockProps,
                wp.element.createElement(Placeholder, {
                    icon: dokumenteIcon,
                    label: 'Dokumente',
                    instructions: 'Wählen Sie bis zu 4 Dokumente aus:',
                },
                    wp.element.createElement('div', { style: { width: '100%' } }, selects, hint)
                )
            );
        },

        // Statischer Save: <div data-finanzleser-dokumente="slug1,slug2,..."></div>
        save: function(props) {
            var slugs = (props.attributes.slugs || []).filter(Boolean).slice(0, DOK_MAX);
            if (!slugs.length) return null;
            var attrs = {};
            attrs['data-finanzleser-dokumente'] = slugs.join(',');
            return wp.element.createElement('div', attrs);
        },
    });

    // ─── Vergleich-Quelle Block (Embed-Config im vergleich-CPT) ───
    var quelleIcon = wp.element.createElement('svg', {
        width: 24, height: 24, viewBox: '0 0 60.4 73.29', fill: 'none',
    },
        wp.element.createElement('rect', { x: 2.5, y: 2.5, width: 55.4, height: 68.29, rx: 4, ry: 4, stroke: '#45a117', strokeWidth: 5, strokeMiterlimit: 10, fill: 'none' }),
        wp.element.createElement('path', { d: 'M22,30 a8,8 0 0 1 0,12 l-6,0 a8,8 0 0 1 0,-12 z M38,30 a8,8 0 0 1 0,12 l6,0 a8,8 0 0 1 0,-12 z M24,36 l12,0', stroke: '#45a117', strokeWidth: 4, fill: 'none', strokeLinecap: 'round' })
    );

    // UTF-8-sichere base64-Helfer (passend zu Node Buffer im Seed + route.ts)
    function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
    function b64decode(b64) { return decodeURIComponent(escape(atob(b64))); }

    var EMBED_TYPES = [
        { label: 'iframe (URL)', value: 'iframe' },
        { label: 'Roh-Embed (HTML/Script einfügen)', value: 'raw' },
        { label: 'Script: finanzen.de', value: 'finanzen-de' },
        { label: 'Script: Covomo', value: 'covomo' },
        { label: 'Script: Bußgeldrechner', value: 'bussgeld' },
    ];

    function decodeQuelle(b64) {
        var base = { embedType: 'iframe', iframeUrl: '', rawHtml: '', scriptJson: '' };
        if (!b64) return base;
        try {
            var obj = JSON.parse(b64decode(b64));
            base.embedType = obj.embedType || (obj.iframeUrl ? 'iframe' : obj.rawHtml ? 'raw' : (obj.scriptConfig && obj.scriptConfig.type) || 'iframe');
            base.iframeUrl = obj.iframeUrl || '';
            base.rawHtml = obj.rawHtml || '';
            base.scriptJson = obj.scriptConfig ? JSON.stringify(obj.scriptConfig, null, 2) : '';
        } catch (e) { /* ungültig → leeres Formular */ }
        return base;
    }

    function encodeQuelle(form) {
        var out = { embedType: form.embedType };
        if (form.embedType === 'iframe') {
            out.iframeUrl = form.iframeUrl || '';
        } else if (form.embedType === 'raw') {
            out.rawHtml = form.rawHtml || '';
        } else {
            var sc = {};
            try { sc = JSON.parse(form.scriptJson || '{}'); } catch (e) { sc = {}; }
            if (!sc.type) sc.type = form.embedType;
            out.scriptConfig = sc;
        }
        return b64encode(JSON.stringify(out));
    }

    registerBlockType('finanzleser/vergleich-quelle', {
        title: 'Vergleich-Quelle (Embed-Config)',
        description: 'Embed-Konfiguration (iframe / Script / Roh-Embed) für diesen Vergleich',
        category: 'embed',
        icon: quelleIcon,
        attributes: {
            config: { type: 'string', default: '' },
        },

        edit: function(props) {
            var blockProps = useBlockProps();
            var form = decodeQuelle(props.attributes.config);
            function update(patch) {
                var next = Object.assign({}, form, patch);
                props.setAttributes({ config: encodeQuelle(next) });
            }

            var fields = [
                wp.element.createElement(SelectControl, {
                    key: 'type',
                    label: 'Einbindungs-Typ',
                    value: form.embedType,
                    options: EMBED_TYPES,
                    onChange: function(val) { update({ embedType: val }); },
                }),
            ];

            if (form.embedType === 'iframe') {
                fields.push(wp.element.createElement(TextControl, {
                    key: 'url',
                    label: 'iframe-URL',
                    value: form.iframeUrl,
                    placeholder: 'https://tools.financeads.net/…',
                    onChange: function(val) { update({ iframeUrl: val }); },
                }));
            } else if (form.embedType === 'raw') {
                fields.push(wp.element.createElement(TextareaControl, {
                    key: 'raw',
                    label: 'Embed-Code (HTML / Script)',
                    help: 'Kompletten Anbieter-Snippet einfügen (z. B. <div>…</div><script src="…"></script>).',
                    value: form.rawHtml,
                    rows: 6,
                    onChange: function(val) { update({ rawHtml: val }); },
                }));
            } else {
                fields.push(wp.element.createElement(TextareaControl, {
                    key: 'json',
                    label: 'Script-Konfiguration (JSON)',
                    help: 'z. B. {"scriptSrc":"…","slotId":"…"}. "type" wird automatisch gesetzt.',
                    value: form.scriptJson,
                    rows: 6,
                    onChange: function(val) { update({ scriptJson: val }); },
                }));
            }

            return wp.element.createElement('div', Object.assign({}, blockProps, {
                style: { border: '2px solid #45A117', borderRadius: 8, padding: 16, background: '#f4faf0' }
            }),
                wp.element.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
                    quelleIcon,
                    wp.element.createElement('strong', { style: { color: '#45A117' } }, 'Vergleich-Quelle (Embed)')
                ),
                fields
            );
        },

        // Dynamic block: Frontend-Ausgabe kommt aus render_callback (PHP).
        save: function() { return null; },
    });

    /* ═══════════════════════════════════════════════════════════════════════════════════
       Statistik — eine Blockart, dreizehn Variationen

       Die Formen stammen aus dem Design-Handoff „Die Zeitung“ (Variante A v2). Der Editor
       zeigt bewusst keine originalgetreue Vorschau: ohne Build-Schritt kann er die Formen
       nicht rendern, und ein halbrichtiges Abbild waere irrefuehrender als eine ehrliche
       Liste. Gezeichnet wird im Frontend (components/statistik/).

       🚨 Die Pruefregeln in statPruefe() gibt es ein zweites Mal in lib/statistik/schema.ts
       (Funktion pruefeStatistik). Wer hier eine Regel aendert, aendert sie dort mit.
       ═══════════════════════════════════════════════════════════════════════════════════ */

    // Die sechs Farben des Handoffs, in genau dieser Reihenfolge (kreisRoh, Zeile 1871).
    var STAT_FARBEN = [
        { label: 'Tinte (Standard)', value: '' },
        { label: 'Grün', value: 'var(--green)' },
        { label: 'Türkis', value: 'var(--tuerkis)' },
        { label: 'Magenta', value: 'var(--pink)' },
        { label: 'Grau', value: 'rgba(51,74,39,.45)' },
        { label: 'Hellgrau', value: 'rgba(51,74,39,.22)' },
    ];

    // Beschreibung jeder Form: welche Listen sie hat, welche Spalten je Zeile, was der
    // Kicker vorn traegt und was die Redaktion wissen muss.
    var STAT_FORMEN = {
        'kreis': {
            titel: 'Kreisdiagramm', icon: 'chart-pie',
            info: 'Aufteilung eines Ganzen. 3 bis 6 Stücke, Summe 100.',
            kopf: ['untertitel', 'einheit'],
            extra: [{ k: 'mitteText', l: 'Text in der Mitte', platz: 'Leistungen' }],
            liste: { k: 'stuecke', l: 'Stücke', spalten: [
                { k: 'label', l: 'Beschriftung' },
                { k: 'wert', l: 'Wert', zahl: true, breite: 90 },
                { k: 'farbe', l: 'Farbe', wahl: STAT_FARBEN, breite: 150 },
            ] },
        },
        'anteilsleiste': {
            titel: 'Anteilsleiste', icon: 'minus',
            info: 'Ein gestapelter Balken über die volle Breite. 3 bis 5 Stücke, Summe 100.',
            kopf: ['untertitel', 'einheit'],
            liste: { k: 'stuecke', l: 'Stücke', spalten: [
                { k: 'label', l: 'Beschriftung' },
                { k: 'wert', l: 'Wert', zahl: true, breite: 90 },
                { k: 'farbe', l: 'Farbe', wahl: STAT_FARBEN, breite: 150 },
            ] },
        },
        'balken': {
            titel: 'Balken', icon: 'menu-alt',
            info: 'Gereihte Werte mit langen Beschriftungen. Muss sich nicht auf 100 summieren.',
            kopf: ['untertitel', 'einheit'],
            extra: [{ k: 'hervor', l: 'Diesen Wert hervorheben (Beschriftung eintippen)' }],
            liste: { k: 'werte', l: 'Werte', spalten: [
                { k: 'label', l: 'Beschriftung' },
                { k: 'wert', l: 'Wert', zahl: true, breite: 90 },
                { k: 'farbe', l: 'Farbe', wahl: STAT_FARBEN, breite: 150 },
            ] },
        },
        'saeulen': {
            titel: 'Säulen', icon: 'chart-bar',
            info: 'Vergleich über Kategorien, etwa Jahre. Bis 8 Kategorien, eine oder zwei Reihen.',
            kopf: ['untertitel', 'einheit'],
            spaltenliste: { k: 'reihen', l: 'Reihen (Legende)', max: 2, spalten: [{ k: 'label', l: 'Name der Reihe' }] },
            matrix: { k: 'kategorien', l: 'Kategorien', schluessel: 'label', schluesselL: 'Kategorie', quelle: 'reihen', quelleL: 'label' },
            extra: [{ k: 'maximum', l: 'Obergrenze der Skala (leer = automatisch)', zahl: true }],
        },
        'linien': {
            titel: 'Liniendiagramm', icon: 'chart-line',
            info: 'Entwicklung über die Zeit. Eine oder zwei Linien.',
            kopf: ['untertitel', 'einheit'],
            achse: true,
            extra: [
                { k: 'notiz', l: 'Anmerkung am rechten Rand', platz: 'Inflation seit 2019' },
                { k: 'yMin', l: 'y-Achse von (leer = automatisch)', zahl: true },
                { k: 'yMax', l: 'y-Achse bis (leer = automatisch)', zahl: true },
            ],
        },
        'spannen': {
            titel: 'Spannen', icon: 'leftright',
            info: 'Von–bis mit Median. 2 bis 6 Zeilen, gemeinsame Skala.',
            kopf: ['untertitel', 'einheit'],
            liste: { k: 'zeilen', l: 'Zeilen', spalten: [
                { k: 'name', l: 'Name' },
                { k: 'min', l: 'von', zahl: true, breite: 80 },
                { k: 'median', l: 'Median', zahl: true, breite: 80 },
                { k: 'max', l: 'bis', zahl: true, breite: 80 },
            ] },
            extra: [
                { k: 'skalaVon', l: 'Skala von (leer = 0)', zahl: true },
                { k: 'skalaBis', l: 'Skala bis (leer = automatisch)', zahl: true },
            ],
        },
        'zeitstrahl': {
            titel: 'Zeitstrahl', icon: 'clock',
            info: 'Ablauf in Stationen. 2 bis 5 Stationen.',
            kopf: ['untertitel'],
            liste: { k: 'stationen', l: 'Stationen', spalten: [
                { k: 'marke', l: 'Marke', platz: 'Tag 0', breite: 120 },
                { k: 'text', l: 'Was passiert' },
                { k: 'x', l: 'Position in % (leer = gleichmäßig)', zahl: true, breite: 110 },
            ] },
        },
        'tabelle': {
            titel: 'Vergleichstabelle', icon: 'editor-table',
            info: 'Leistungen gegen Tarifstufen. Eine Spalte darf Empfehlung sein.',
            kopf: ['untertitel'],
            extra: [
                { k: 'zeilenkopf', l: 'Kopfzelle der ersten Spalte', platz: 'Leistung' },
                { k: 'fussnote', l: 'Fußnote unter der Tabelle' },
            ],
            spaltenliste: { k: 'spalten', l: 'Spalten', max: 5, spalten: [
                { k: 'name', l: 'Spaltenname' },
                { k: 'tag', l: 'Auszeichnung', platz: 'Empfehlung', breite: 140 },
                { k: 'hervor', l: 'hervorheben', schalter: true, breite: 110 },
            ] },
            matrix: { k: 'zeilen', l: 'Zeilen', schluessel: 'name', schluesselL: 'Leistung', quelle: 'spalten', quelleL: 'name', text: true },
        },
        'kennzahlen-vierer': {
            titel: 'Kennzahlen-Vierer', icon: 'grid-view',
            info: 'Drei oder vier große Zahlen nebeneinander. Die Zahl zählt beim Lesen hoch.',
            kopf: [],
            liste: { k: 'kacheln', l: 'Kacheln', spalten: [
                { k: 'label', l: 'Überschrift', platz: 'Standard', breite: 150 },
                { k: 'zahl', l: 'Zahl', zahl: true, breite: 80 },
                { k: 'einheit', l: 'Einheit', platz: 'Mio. €', breite: 100 },
                { k: 'text', l: 'Erläuterung' },
                { k: 'farbe', l: 'Farbe', wahl: STAT_FARBEN, breite: 150 },
            ] },
        },
        'kennzahlen-liste': {
            titel: 'Kennzahlen-Liste', icon: 'list-view',
            info: 'Name links, Wert rechts, Punktführung dazwischen. 3 bis 8 Zeilen.',
            kopf: ['untertitel'],
            liste: { k: 'zeilen', l: 'Zeilen', spalten: [
                { k: 'name', l: 'Name' },
                { k: 'wert', l: 'Wert (frei, z. B. 85 %)', breite: 200 },
            ] },
        },
        'schrittfolge': {
            titel: 'Schrittfolge', icon: 'editor-ol',
            info: 'Nummerierte Schritte. 2 bis 6 Schritte.',
            kopf: ['untertitel'],
            liste: { k: 'schritte', l: 'Schritte', spalten: [
                { k: 'titel', l: 'Titel des Schritts' },
                { k: 'text', l: 'Erläuterung' },
            ] },
        },
        'abwaegung': {
            titel: 'Abwägung', icon: 'randomize',
            info: 'Dafür und Dagegen nebeneinander. Je 1 bis 4 Punkte.',
            kopf: ['untertitel'],
            zweiListen: [
                { k: 'pro', l: 'Dafür', platz: 'Beitrag sinkt um 15 bis 25 Prozent.' },
                { k: 'contra', l: 'Dagegen', platz: 'Ersparnis liegt oft unter 15 € im Jahr.' },
            ],
        },
        'begriffe': {
            titel: 'Begriffe', icon: 'book',
            info: 'Begriff und Erklärung. Aus dem gepflegten Glossar übernehmen, nicht neu formulieren.',
            kopf: ['untertitel'],
            liste: { k: 'begriffe', l: 'Begriffe', spalten: [
                { k: 'begriff', l: 'Begriff', breite: 220 },
                { k: 'text', l: 'Erklärung' },
            ] },
        },
        'vergleichsrechner': {
            titel: 'Vergleichsrechner', icon: 'admin-links',
            info: 'Hängt einen externen Vergleichsrechner in den Beitrag. Freigabe per Zwei-Klick.',
            kopf: [],
            vergleich: true,
        },
    };

    var STAT_ARTEN = Object.keys(STAT_FORMEN);

    function statDecode(b64) {
        if (!b64) return null;
        try { return JSON.parse(b64decode(b64)); } catch (e) { return null; }
    }
    function statEncode(o) { return b64encode(JSON.stringify(o)); }

    function statLeer(art) {
        var o = { art: art, titel: '', quelle: { name: '', url: '', stand: '', sekundaer: false } };
        var f = STAT_FORMEN[art] || {};
        if (f.liste) o[f.liste.k] = [];
        if (f.spaltenliste) o[f.spaltenliste.k] = [];
        if (f.matrix) o[f.matrix.k] = [];
        if (f.zweiListen) f.zweiListen.forEach(function(z) { o[z.k] = []; });
        if (f.achse) { o.achse = []; o.reihen = []; }
        if (f.vergleich) o.slug = '';
        return o;
    }

    var zahlOk = function(n) { return typeof n === 'number' && isFinite(n); };

    /** Zwilling von pruefeStatistik in lib/statistik/schema.ts. Klartext-Beanstandungen. */
    function statPruefe(s) {
        var f = [];
        if (!s) return ['Der Block ist noch leer.'];
        if (!s.titel || !s.titel.trim()) f.push('Titel fehlt.');
        var q = s.quelle || {};
        if (!q.name || !q.name.trim()) f.push('Quelle fehlt.');
        else {
            if (!q.url || !/^https:\/\//.test(q.url)) f.push('Quelle braucht eine https-URL.');
            if (!q.stand || !q.stand.trim()) f.push('Quelle braucht einen Stand.');
        }
        var n;
        if (s.art === 'kreis' || s.art === 'anteilsleiste') {
            var st = s.stuecke || []; n = st.length;
            var g = s.art === 'kreis' ? [3, 6] : [3, 5];
            if (n < g[0] || n > g[1]) f.push(g[0] + ' bis ' + g[1] + ' Stücke, nicht ' + n + '.');
            if (!st.every(function(x) { return zahlOk(x.wert) && x.label && x.label.trim(); })) f.push('Jedes Stück braucht Beschriftung und Zahl.');
            else {
                var sum = st.reduce(function(a, x) { return a + x.wert; }, 0);
                if (Math.abs(sum - 100) > 0.5) f.push('Anteile summieren sich auf ' + sum.toFixed(1) + ', nicht auf 100.');
            }
        } else if (s.art === 'balken') {
            n = (s.werte || []).length;
            if (n < 2 || n > 8) f.push('2 bis 8 Werte, nicht ' + n + '.');
            if (!(s.werte || []).every(function(x) { return zahlOk(x.wert) && x.label && x.label.trim(); })) f.push('Jeder Wert braucht Beschriftung und Zahl.');
        } else if (s.art === 'saeulen') {
            if (!(s.reihen || []).length || s.reihen.length > 2) f.push('Eine oder zwei Reihen, nicht mehr.');
            n = (s.kategorien || []).length;
            if (n < 2 || n > 8) f.push('2 bis 8 Kategorien, nicht ' + n + '.');
            if (!(s.kategorien || []).every(function(k) { return (k.werte || []).length === (s.reihen || []).length && k.werte.every(zahlOk); })) f.push('Jede Kategorie braucht je Reihe genau eine Zahl.');
        } else if (s.art === 'spannen') {
            n = (s.zeilen || []).length;
            if (n < 2 || n > 6) f.push('2 bis 6 Zeilen, nicht ' + n + '.');
            (s.zeilen || []).forEach(function(z) {
                if (!zahlOk(z.min) || !zahlOk(z.median) || !zahlOk(z.max)) f.push('„' + (z.name || '?') + '“: von, Median und bis müssen Zahlen sein.');
                else if (!(z.min <= z.median && z.median <= z.max)) f.push('„' + (z.name || '?') + '“: von ≤ Median ≤ bis ist verletzt.');
            });
        } else if (s.art === 'linien') {
            if (!(s.achse || []).length) f.push('Achsenbeschriftung fehlt.');
            if (!(s.reihen || []).length || s.reihen.length > 2) f.push('Eine oder zwei Linien, nicht mehr.');
            (s.reihen || []).forEach(function(r) {
                if ((r.werte || []).length !== (s.achse || []).length) f.push('Reihe „' + (r.label || '?') + '“ hat ' + (r.werte || []).length + ' Werte, die Achse ' + (s.achse || []).length + '.');
                if (!(r.werte || []).every(zahlOk)) f.push('Reihe „' + (r.label || '?') + '“ enthält keine reinen Zahlen.');
            });
        } else if (s.art === 'zeitstrahl') {
            n = (s.stationen || []).length;
            if (n < 2 || n > 5) f.push('2 bis 5 Stationen, nicht ' + n + '.');
        } else if (s.art === 'tabelle') {
            if (!(s.spalten || []).length) f.push('Spalten fehlen.');
            if (!(s.zeilen || []).length) f.push('Zeilen fehlen.');
            (s.zeilen || []).forEach(function(z) {
                if ((z.werte || []).length !== (s.spalten || []).length) f.push('Zeile „' + (z.name || '?') + '“ hat ' + (z.werte || []).length + ' Werte, die Tabelle ' + (s.spalten || []).length + ' Spalten.');
            });
        } else if (s.art === 'kennzahlen-vierer') {
            n = (s.kacheln || []).length;
            if (n < 3 || n > 4) f.push('3 oder 4 Kacheln, nicht ' + n + '.');
            if (!(s.kacheln || []).every(function(k) { return zahlOk(k.zahl); })) f.push('Jede Kachel braucht eine Zahl.');
        } else if (s.art === 'kennzahlen-liste') {
            n = (s.zeilen || []).length;
            if (n < 3 || n > 8) f.push('3 bis 8 Zeilen, nicht ' + n + '.');
        } else if (s.art === 'schrittfolge') {
            n = (s.schritte || []).length;
            if (n < 2 || n > 6) f.push('2 bis 6 Schritte, nicht ' + n + '.');
        } else if (s.art === 'abwaegung') {
            if (!(s.pro || []).length || !(s.contra || []).length) f.push('Dafür und Dagegen brauchen je mindestens einen Punkt.');
            if ((s.pro || []).length > 4 || (s.contra || []).length > 4) f.push('Höchstens vier Punkte je Seite.');
        } else if (s.art === 'begriffe') {
            n = (s.begriffe || []).length;
            if (n < 2 || n > 5) f.push('2 bis 5 Begriffe, nicht ' + n + '.');
        } else if (s.art === 'vergleichsrechner') {
            if (!s.slug || !s.slug.trim()) f.push('Vergleich ist nicht gewählt.');
        }
        return f;
    }

    /* ── Bausteine der Eingabe ─────────────────────────────────────────────────────── */

    var el = wp.element.createElement;

    function statKnopf(text, onClick, dezent) {
        return el(Button, { variant: dezent ? 'tertiary' : 'secondary', isSmall: true, onClick: onClick }, text);
    }

    /** Eine Zelle: Text, Zahl, Auswahl oder Schalter — je nach Spaltenbeschreibung. */
    function statZelle(sp, wert, onChange, key) {
        var stil = { width: sp.breite ? sp.breite + 'px' : 'auto', flex: sp.breite ? '0 0 auto' : '1 1 120px' };
        if (sp.schalter) {
            return el('label', { key: key, style: Object.assign({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }, stil) },
                el('input', { type: 'checkbox', checked: !!wert, onChange: function(e) { onChange(e.target.checked); } }), sp.l);
        }
        if (sp.wahl) {
            return el('div', { key: key, style: stil }, el(SelectControl, {
                value: wert || '', options: sp.wahl, __nextHasNoMarginBottom: true,
                onChange: function(v) { onChange(v || undefined); },
            }));
        }
        return el('div', { key: key, style: stil }, el(TextControl, {
            value: wert === undefined || wert === null ? '' : String(wert),
            placeholder: sp.platz || sp.l,
            type: sp.zahl ? 'number' : 'text',
            __nextHasNoMarginBottom: true,
            onChange: function(v) {
                if (!sp.zahl) { onChange(v); return; }
                if (v === '') { onChange(undefined); return; }
                var n = parseFloat(String(v).replace(',', '.'));
                onChange(isFinite(n) ? n : undefined);
            },
        }));
    }

    function statKopfzeile(spalten, extra) {
        return el('div', { style: { display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 4 } },
            spalten.map(function(sp, i) {
                return el('span', { key: i, style: { width: sp.breite ? sp.breite + 'px' : 'auto', flex: sp.breite ? '0 0 auto' : '1 1 120px', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#686C6A' } }, sp.schalter ? '' : sp.l);
            }),
            el('span', { style: { width: 34, flex: '0 0 auto' } }, extra || '')
        );
    }

    /** Liste mit festen Spalten: Zeilen hinzufuegen, aendern, loeschen, verschieben. */
    function statListe(titel, spalten, zeilen, setzen, hinweis) {
        zeilen = zeilen || [];
        function patch(i, k, v) {
            var next = zeilen.slice();
            next[i] = Object.assign({}, next[i]);
            if (v === undefined) delete next[i][k]; else next[i][k] = v;
            setzen(next);
        }
        return el('div', { style: { marginTop: 14 } },
            el('strong', { style: { display: 'block', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#334A27', marginBottom: 6 } }, titel),
            hinweis ? el('p', { style: { margin: '0 0 8px', fontSize: 12, color: '#686C6A' } }, hinweis) : null,
            zeilen.length ? statKopfzeile(spalten) : null,
            zeilen.map(function(z, i) {
                return el('div', { key: i, style: { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 } },
                    spalten.map(function(sp, j) {
                        return statZelle(sp, z[sp.k], function(v) { patch(i, sp.k, v); }, j);
                    }),
                    el('div', { style: { width: 34, flex: '0 0 auto', display: 'flex', gap: 2 } },
                        statKnopf('✕', function() { setzen(zeilen.filter(function(_, x) { return x !== i; })); }, true)
                    )
                );
            }),
            statKnopf('+ Zeile', function() { setzen(zeilen.concat([{}])); })
        );
    }

    /** Liste aus reinen Texten (Dafuer / Dagegen). */
    function statTextliste(titel, platz, werte, setzen) {
        werte = werte || [];
        return el('div', { style: { marginTop: 14, flex: '1 1 240px' } },
            el('strong', { style: { display: 'block', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#334A27', marginBottom: 6 } }, titel),
            werte.map(function(w, i) {
                return el('div', { key: i, style: { display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 } },
                    el('div', { style: { flex: 1 } }, el(TextControl, {
                        value: w || '', placeholder: platz, __nextHasNoMarginBottom: true,
                        onChange: function(v) { var n = werte.slice(); n[i] = v; setzen(n); },
                    })),
                    statKnopf('✕', function() { setzen(werte.filter(function(_, x) { return x !== i; })); }, true)
                );
            }),
            statKnopf('+ Punkt', function() { setzen(werte.concat([''])); })
        );
    }

    /**
     * Matrix: eine Schluesselspalte plus je eine Wertespalte pro Eintrag einer anderen Liste.
     * Traegt Saeulen (Kategorie × Reihe) und die Vergleichstabelle (Leistung × Spalte).
     */
    function statMatrix(m, quelle, zeilen, setzen) {
        zeilen = zeilen || [];
        quelle = quelle || [];
        var spalten = [{ k: m.schluessel, l: m.schluesselL }].concat(quelle.map(function(q, i) {
            return { k: '__w' + i, l: q[m.quelleL] || ('Spalte ' + (i + 1)), zahl: !m.text, breite: 110 };
        }));
        function patch(i, k, v) {
            var next = zeilen.slice();
            var z = Object.assign({}, next[i]);
            if (k === m.schluessel) { z[k] = v; }
            else {
                var idx = parseInt(k.slice(3), 10);
                var w = (z.werte || []).slice();
                while (w.length < quelle.length) w.push(m.text ? '' : undefined);
                w[idx] = v === undefined && m.text ? '' : v;
                z.werte = w.slice(0, quelle.length);
            }
            next[i] = z;
            setzen(next);
        }
        return el('div', { style: { marginTop: 14 } },
            el('strong', { style: { display: 'block', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#334A27', marginBottom: 6 } }, m.l),
            !quelle.length ? el('p', { style: { margin: 0, fontSize: 12, color: '#D3005E' } }, 'Erst oben mindestens eine Spalte anlegen.') : null,
            quelle.length && zeilen.length ? statKopfzeile(spalten) : null,
            quelle.length ? zeilen.map(function(z, i) {
                return el('div', { key: i, style: { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 } },
                    spalten.map(function(sp, j) {
                        var wert = j === 0 ? z[m.schluessel] : (z.werte || [])[j - 1];
                        return statZelle(sp, wert, function(v) { patch(i, sp.k, v); }, j);
                    }),
                    el('div', { style: { width: 34, flex: '0 0 auto' } },
                        statKnopf('✕', function() { setzen(zeilen.filter(function(_, x) { return x !== i; })); }, true)
                    )
                );
            }) : null,
            quelle.length ? statKnopf('+ Zeile', function() { setzen(zeilen.concat([{ werte: quelle.map(function() { return m.text ? '' : undefined; }) }])); }) : null
        );
    }

    /* ── Der Block ─────────────────────────────────────────────────────────────────── */

    registerBlockType('finanzleser/statistik', {
        title: 'Statistik',
        description: 'Zahlen, Listen und Tabellen im Zeitungssatz',
        category: 'embed',
        icon: 'chart-pie',
        attributes: {
            art: { type: 'string', default: '' },
            daten: { type: 'string', default: '' },
        },

        edit: function(props) {
            var blockProps = useBlockProps();
            var art = props.attributes.art || '';
            var daten = statDecode(props.attributes.daten) || statLeer(art);
            var form = STAT_FORMEN[art];

            // Vergleichsliste fuer die Form „vergleichsrechner“ (derselbe Endpunkt wie der
            // Vergleich-Block).
            var vergleicheState = useState(null);
            var vergleiche = vergleicheState[0], setVergleiche = vergleicheState[1];
            useEffect(function() {
                if (!form || !form.vergleich || vergleiche) return;
                apiFetch({ path: '/finanzleser/v1/vergleiche' })
                    .then(function(r) { setVergleiche(r || []); })
                    .catch(function() { setVergleiche([]); });
            }, [art]);

            function schreibe(patch) {
                var next = Object.assign({}, daten, patch, { art: art });
                props.setAttributes({ art: art, daten: statEncode(next) });
            }
            function quelle(patch) { schreibe({ quelle: Object.assign({}, daten.quelle || {}, patch) }); }

            // Noch keine Art gewaehlt: die dreizehn Formen zur Auswahl stellen.
            if (!form) {
                return el('div', blockProps,
                    el(Placeholder, { icon: 'chart-pie', label: 'Statistik', instructions: 'Welche Form soll es sein?' },
                        el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
                            STAT_ARTEN.map(function(a) {
                                return el(Button, { key: a, variant: 'secondary', onClick: function() {
                                    props.setAttributes({ art: a, daten: statEncode(statLeer(a)) });
                                } }, STAT_FORMEN[a].titel);
                            })
                        )
                    )
                );
            }

            var teile = [];

            teile.push(el(TextControl, {
                key: 'titel', label: 'Titel (steht im Kicker hinter „' + form.titel + ' · “)',
                value: daten.titel || '', placeholder: 'Wofür die Hausrat zahlt',
                onChange: function(v) { schreibe({ titel: v }); },
            }));
            if (form.kopf.indexOf('untertitel') >= 0) {
                teile.push(el(TextControl, {
                    key: 'unter', label: 'Beizeile (kursiv)', value: daten.untertitel || '',
                    placeholder: 'Anteil an den Leistungen 2025',
                    onChange: function(v) { schreibe({ untertitel: v }); },
                }));
            }
            if (form.kopf.indexOf('einheit') >= 0) {
                teile.push(el(TextControl, {
                    key: 'einheit', label: 'Einheit', value: daten.einheit || '', placeholder: '%',
                    onChange: function(v) { schreibe({ einheit: v }); },
                }));
            }

            if (form.liste) {
                teile.push(el('div', { key: 'liste' }, statListe(form.liste.l, form.liste.spalten, daten[form.liste.k], function(n) {
                    var p = {}; p[form.liste.k] = n; schreibe(p);
                })));
            }
            if (form.spaltenliste) {
                var sl = form.spaltenliste;
                teile.push(el('div', { key: 'sl' }, statListe(sl.l, sl.spalten, daten[sl.k], function(n) {
                    var p = {}; p[sl.k] = n.slice(0, sl.max); schreibe(p);
                }, 'Höchstens ' + sl.max + '.')));
            }
            if (form.matrix) {
                teile.push(el('div', { key: 'matrix' }, statMatrix(form.matrix, daten[form.matrix.quelle], daten[form.matrix.k], function(n) {
                    var p = {}; p[form.matrix.k] = n; schreibe(p);
                })));
            }
            if (form.achse) {
                // Liniendiagramm: Stuetzstellen und bis zu zwei Linien. Im Editor stehen die
                // Stuetzstellen als Zeilen, die Linien als Spalten — im Datensatz ist es
                // umgekehrt (achse[] plus reihen[].werte[]), das rechnet der Setzer um.
                var reihen = daten.reihen || [];
                var achse = daten.achse || [];
                var mZeilen = achse.map(function(a, i) {
                    return { name: a, werte: reihen.map(function(r) { return (r.werte || [])[i]; }) };
                });
                teile.push(el('div', { key: 'linien-reihen' }, statListe('Linien', [{ k: 'label', l: 'Name der Linie' }, { k: 'farbe', l: 'Farbe', wahl: STAT_FARBEN, breite: 150 }], reihen, function(n) {
                    schreibe({ reihen: n.slice(0, 2).map(function(r, j) { return Object.assign({ werte: (reihen[j] || {}).werte || [] }, r); }) });
                }, 'Eine oder zwei.')));
                teile.push(el('div', { key: 'linien-achse' }, statMatrix(
                    { k: 'punkte', l: 'Stützstellen', schluessel: 'name', schluesselL: 'Beschriftung (z. B. Jahr)', quelle: 'reihen', quelleL: 'label' },
                    reihen, mZeilen,
                    function(n) {
                        schreibe({
                            achse: n.map(function(z) { return z.name || ''; }),
                            reihen: reihen.map(function(r, j) { return Object.assign({}, r, { werte: n.map(function(z) { return (z.werte || [])[j]; }) }); }),
                        });
                    }
                )));
            }
            if (form.zweiListen) {
                teile.push(el('div', { key: 'zwei', style: { display: 'flex', gap: 20, flexWrap: 'wrap' } },
                    form.zweiListen.map(function(z) {
                        return el('div', { key: z.k, style: { flex: '1 1 240px' } },
                            statTextliste(z.l, z.platz, daten[z.k], function(n) { var p = {}; p[z.k] = n; schreibe(p); }));
                    })
                ));
            }
            if (form.vergleich) {
                teile.push(vergleiche === null
                    ? el(Spinner, { key: 'sp' })
                    : el(SelectControl, {
                        key: 'vgl', label: 'Welcher Vergleich?', value: daten.slug || '',
                        options: [{ label: '— bitte wählen —', value: '' }].concat((vergleiche || []).map(function(v) {
                            return { label: v.title, value: v.slug };
                        })),
                        onChange: function(v) { schreibe({ slug: v }); },
                    }));
            }
            (form.extra || []).forEach(function(x) {
                teile.push(el(TextControl, {
                    key: x.k, label: x.l, value: daten[x.k] === undefined ? '' : String(daten[x.k]),
                    placeholder: x.platz || '', type: x.zahl ? 'number' : 'text',
                    onChange: function(v) {
                        var p = {};
                        if (!x.zahl) p[x.k] = v;
                        else if (v === '') p[x.k] = undefined;
                        else { var n = parseFloat(String(v).replace(',', '.')); p[x.k] = isFinite(n) ? n : undefined; }
                        schreibe(p);
                    },
                }));
            });

            // Quelle — Pflicht. Keine Zahl ohne Beleg mit https-URL und Stand.
            var q = daten.quelle || {};
            teile.push(el('div', { key: 'quelle', style: { marginTop: 18, paddingTop: 12, borderTop: '1px solid rgba(51,74,39,.2)' } },
                el('strong', { style: { display: 'block', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#334A27', marginBottom: 6 } }, 'Quelle (Pflicht)'),
                el('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                    el('div', { style: { flex: '1 1 200px' } }, el(TextControl, { label: 'Name', value: q.name || '', placeholder: 'GDV Statistisches Taschenbuch', __nextHasNoMarginBottom: true, onChange: function(v) { quelle({ name: v }); } })),
                    el('div', { style: { flex: '1 1 260px' } }, el(TextControl, { label: 'URL (https)', value: q.url || '', placeholder: 'https://…', __nextHasNoMarginBottom: true, onChange: function(v) { quelle({ url: v }); } })),
                    el('div', { style: { flex: '0 0 130px' } }, el(TextControl, { label: 'Stand', value: q.stand || '', placeholder: '2025', __nextHasNoMarginBottom: true, onChange: function(v) { quelle({ stand: v }); } }))
                ),
                el('label', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 8 } },
                    el('input', { type: 'checkbox', checked: !!q.sekundaer, onChange: function(e) { quelle({ sekundaer: e.target.checked }); } }),
                    'Sekundärquelle (gibt die Zahl nur wieder)')
            ));
            teile.push(el(TextControl, {
                key: 'hinweis', label: 'Hinweis unter der Form (optional)', value: daten.hinweis || '',
                onChange: function(v) { schreibe({ hinweis: v }); },
            }));

            var befunde = statPruefe(daten);

            return el('div', Object.assign({}, blockProps, {
                style: { border: '2px solid #334A27', padding: 16, background: '#faf9f6' },
            }),
                el('div', { style: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 } },
                    el('strong', { style: { fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', color: '#334A27' } }, form.titel),
                    el('button', {
                        type: 'button',
                        style: { border: 0, background: 'none', padding: 0, fontSize: 12, color: '#2E7A0B', cursor: 'pointer', textDecoration: 'underline' },
                        onClick: function() { props.setAttributes({ art: '', daten: '' }); },
                    }, 'Form wechseln')
                ),
                el('p', { style: { margin: '0 0 12px', fontSize: 12, color: '#686C6A' } }, form.info),
                teile,
                befunde.length
                    ? el('ul', { style: { margin: '14px 0 0', padding: '8px 14px', listStyle: 'none', borderLeft: '3px solid #D3005E', fontSize: 13, color: '#D3005E' } },
                        befunde.map(function(b, i) { return el('li', { key: i }, b); }))
                    : el('p', { style: { margin: '14px 0 0', fontSize: 13, color: '#2E7A0B' } }, '✓ Vollständig.')
            );
        },

        // Dynamic block: die Ausgabe kommt aus render_callback (PHP).
        save: function() { return null; },
    });

    // Dreizehn Eintraege im Inserter, eine Implementierung.
    STAT_ARTEN.forEach(function(a) {
        var f = STAT_FORMEN[a];
        wp.blocks.registerBlockVariation('finanzleser/statistik', {
            name: 'statistik-' + a,
            title: f.titel,
            description: f.info,
            icon: f.icon,
            category: 'embed',
            attributes: { art: a },
            isActive: ['art'],
            scope: ['inserter', 'transform'],
        });
    });


    /* ═══════════════════════════════════════════════════════════════════════════════════
       Leo-Fragen — Seitenleiste im Beitrags-Editor

       Die Fragen liegen im Post-Meta `leo_fragen` (mu-plugin finanzleser-faden), als
       JSON-Zeichenkette. Registriert war das Feld von Anfang an, eine Oberfläche dafür gab
       es aber nicht — gepflegt wurde nur per Skript. Das holt dieses Panel nach.

       Im Faden erscheint jede Frage als Chip am Ende ihres Abschnitts; beim Antippen
       schreibt Leo die Antwort darunter (components/faden/kette/Weiterlesen.tsx). Die
       Antworten stehen außerdem in den strukturierten Daten der Seite (FAQPage).

       🚨 Der Abschnitt ist die fehleranfälligste Stelle: `heading-<n>` zählt fortlaufend
       über ALLE Zwischenüberschriften des Beitrags, beginnend bei 0. Deshalb bietet das
       Panel keine Zahl zum Eintippen, sondern die Überschriften des Beitrags zur Auswahl —
       aus dem gerade bearbeiteten Inhalt gelesen, nicht aus einem gespeicherten Stand.
       ═══════════════════════════════════════════════════════════════════════════════════ */

    var LEO_STATUS = [
        { label: 'freigegeben', value: 'freigegeben' },
        { label: 'Entwurf', value: 'entwurf' },
    ];

    /** Die Zwischenüberschriften des Beitrags als Auswahl — in derselben Zählung wie im Faden. */
    function leoAbschnitte(inhalt) {
        var raus = [];
        var re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
        var m, i = 0;
        while ((m = re.exec(inhalt)) !== null) {
            var txt = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
            raus.push({ nr: i, titel: txt, wert: 'heading-' + i });
            i++;
        }
        return raus;
    }

    function leoLies(roh) {
        if (!roh) return [];
        try { var x = JSON.parse(roh); return Array.isArray(x) ? x : []; } catch (e) { return []; }
    }

    function LeoFragenPanel() {
        var typ = useSelect(function (s) { return s('core/editor').getCurrentPostType(); }, []);
        var inhalt = useSelect(function (s) { return s('core/editor').getEditedPostContent(); }, []);
        var metaPaar = useEntityProp('postType', typ, 'meta');
        var meta = metaPaar[0] || {}, setMeta = metaPaar[1];

        if (typ !== 'post') return null;

        var fragen = leoLies(meta.leo_fragen);
        var abschnitte = leoAbschnitte(inhalt || '');
        // Fazit und Häufige Fragen tragen im Faden keine Chips — sie werden anders gesetzt.
        var waehlbar = abschnitte.filter(function (a) {
            return a.nr >= 2 && !/^fazit\b/i.test(a.titel) && !/h[äa]ufig|faq/i.test(a.titel);
        });

        function schreibe(next) {
            var m = Object.assign({}, meta);
            m.leo_fragen = JSON.stringify(next);
            setMeta(m);
        }
        function aendere(i, patch) {
            var next = fragen.slice();
            next[i] = Object.assign({}, next[i], patch);
            // Der Titel wird mitgeführt, damit im CMS lesbar bleibt, wohin die Frage gehört.
            if (patch.abschnitt) {
                var a = abschnitte.filter(function (x) { return x.wert === patch.abschnitt; })[0];
                next[i].abschnitt_titel = a ? a.titel : '';
            }
            schreibe(next);
        }

        var jeAbschnitt = {};
        fragen.forEach(function (f) { jeAbschnitt[f.abschnitt] = (jeAbschnitt[f.abschnitt] || 0) + 1; });

        var hinweise = [];
        if (fragen.length < 8) hinweise.push('Acht bis fünfzehn Fragen je Beitrag sind das Ziel — hier sind es ' + fragen.length + '.');
        if (fragen.length > 15) hinweise.push('Mehr als fünfzehn Fragen überfrachten den Beitrag.');
        fragen.forEach(function (f, i) {
            var nr = i + 1;
            if (!f.frage || !f.frage.trim()) hinweise.push('Frage ' + nr + ': Text fehlt.');
            if (!f.antwort || !f.antwort.trim()) hinweise.push('Frage ' + nr + ': Antwort fehlt.');
            if (!f.abschnitt) hinweise.push('Frage ' + nr + ': Abschnitt nicht gewählt.');
            else if (!waehlbar.some(function (a) { return a.wert === f.abschnitt; })) {
                hinweise.push('Frage ' + nr + ': „' + f.abschnitt + '" gibt es nicht mehr oder ist Fazit/FAQ.');
            }
        });
        Object.keys(jeAbschnitt).forEach(function (k) {
            if (jeAbschnitt[k] > 3) hinweise.push(k + ' trägt ' + jeAbschnitt[k] + ' Fragen — höchstens drei je Abschnitt.');
        });

        var karten = fragen.map(function (f, i) {
            return el('div', { key: i, style: { border: '1px solid #ddd', borderLeft: '3px solid #45A117', padding: '10px 12px', marginBottom: 10, background: '#fff' } },
                el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
                    el('strong', { style: { fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#686C6A' } }, 'Frage ' + (i + 1)),
                    statKnopf('✕', function () { schreibe(fragen.filter(function (_, x) { return x !== i; })); }, true)
                ),
                el(SelectControl, {
                    label: 'Abschnitt', value: f.abschnitt || '', __nextHasNoMarginBottom: true,
                    options: [{ label: '— bitte wählen —', value: '' }].concat(waehlbar.map(function (a) {
                        return { label: a.nr + ' · ' + a.titel.slice(0, 46), value: a.wert };
                    })),
                    onChange: function (v) { aendere(i, { abschnitt: v }); },
                }),
                el(TextControl, {
                    label: 'Frage', value: f.frage || '', __nextHasNoMarginBottom: true,
                    placeholder: 'Ich pflege meine Mutter zu Hause. Bekomme ich dafür etwas?',
                    onChange: function (v) { aendere(i, { frage: v }); },
                }),
                el(TextareaControl, {
                    label: 'Antwort', value: f.antwort || '', rows: 5, __nextHasNoMarginBottom: true,
                    help: 'Drei bis fünf Sätze, konkret, mit Zahlen.',
                    onChange: function (v) { aendere(i, { antwort: v }); },
                }),
                el(TextControl, {
                    label: 'Quellen', value: (f.quellen || []).join(', '), __nextHasNoMarginBottom: true,
                    placeholder: '§ 44 SGB XI, § 3 SGB VI',
                    help: 'Mehrere mit Komma trennen.',
                    onChange: function (v) { aendere(i, { quellen: v.split(',').map(function (x) { return x.trim(); }).filter(Boolean) }); },
                }),
                el(SelectControl, {
                    label: 'Status', value: f.status || 'freigegeben', options: LEO_STATUS, __nextHasNoMarginBottom: true,
                    help: 'Nur freigegebene Fragen erscheinen im Faden.',
                    onChange: function (v) { aendere(i, { status: v }); },
                })
            );
        });

        return el(LeoPanel, { name: 'finanzleser-leo-fragen', title: 'Leo-Fragen (' + fragen.length + ')', className: 'finanzleser-leo' },
            el('p', { style: { margin: '0 0 10px', fontSize: 12, color: '#686C6A' } },
                'Erscheinen im Faden als Chips am Ende ihres Abschnitts — und in den strukturierten Daten der Seite.'),
            !abschnitte.length
                ? el('p', { style: { color: '#D3005E', fontSize: 12 } }, 'Der Beitrag hat noch keine Zwischenüberschriften.')
                : null,
            karten,
            statKnopf('+ Frage', function () {
                schreibe(fragen.concat([{ abschnitt: (waehlbar[0] || {}).wert || '', abschnitt_titel: (waehlbar[0] || {}).titel || '', frage: '', antwort: '', quellen: [], status: 'freigegeben' }]));
            }),
            hinweise.length
                ? el('ul', { style: { margin: '12px 0 0', padding: '8px 12px', listStyle: 'none', borderLeft: '3px solid #D3005E', fontSize: 12, color: '#D3005E' } },
                    hinweise.map(function (h, i) { return el('li', { key: i }, h); }))
                : el('p', { style: { margin: '12px 0 0', fontSize: 12, color: '#2E7A0B' } }, '✓ Vollständig.')
        );
    }

    // Das Panel heißt seit WordPress 6.6 wp.editor.PluginDocumentSettingPanel; davor lag es
    // in wp.editPost. Beide Wege stehen hier, damit es auf älteren Ständen nicht bricht.
    var LeoPanel = (wp.editor && wp.editor.PluginDocumentSettingPanel)
        || (wp.editPost && wp.editPost.PluginDocumentSettingPanel);

    if (LeoPanel && wp.plugins && wp.coreData && wp.data) {
        wp.plugins.registerPlugin('finanzleser-leo-fragen', { render: LeoFragenPanel, icon: 'format-chat' });
    }

})();
