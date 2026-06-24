from app.enrichment import _strip_html


def test_strip_html_removes_tags():
    assert "hello world" in _strip_html("<div><p>hello</p> <b>world</b></div>")


def test_strip_html_truncates():
    long = "<p>" + "x" * 20000 + "</p>"
    assert len(_strip_html(long, max_chars=100)) == 100


def test_strip_html_collapses_whitespace():
    result = _strip_html("<div>   a   b   c   </div>")
    assert result == "a b c"
