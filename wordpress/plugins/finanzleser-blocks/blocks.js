(function() {
    const { registerBlockType } = wp.blocks;
    const { useState, useEffect } = wp.element;
    const { SelectControl, Placeholder, Spinner, TextControl, TextareaControl } = wp.components;
    const { useBlockProps } = wp.blockEditor;
    const apiFetch = wp.apiFetch;

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
})();
