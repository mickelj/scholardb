const isbn = require('node-isbn');

module.exports = function () {
	function isbnCheck(a) {
		var b = i = r = 0,
			t = 10,
			l = a.length;
		if (l == t) {
			for (i; i < 9; i++) b += a[i] * (t - i);
			r = (b + (a[9] == 'X' ? t : a[9])) % 11 == 0;
		}
		if (l == 13) {
			for (i; i < 12; i++) b += (i + 1) % 2 ? +a[i] : a[i] * 3;
			r = b % t == t - (+a[12] || t);
		}
		return r ? a : false;
	}

	function isbnClean(isbnVal) {
		return isbnVal.replace(/[^0-9Xx]/g, '');
	}

	function isbnSearch(isbnVal) {
		if (isbnCheck(isbnVal)) {
			isbn.resolve(isbnClean(isbnVal), (err, book) => {
				if (err) return next(err);

				return book;
			});
		}

		return next();
	}
};