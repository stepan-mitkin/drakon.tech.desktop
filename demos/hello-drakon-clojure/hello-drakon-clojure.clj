(ns hello3.hello-drakon-clojure)

(defn fibonacci [n]
    (if (<= n 1)
        (do
            (println "trivial case, n =" n)
            n)
        (let [n-2 (fibonacci (- n 2)) n-1 (fibonacci (- n 1))]
            (+ n-2 n-1))))

(defn hello [first-name second-name]
    (println "hello")
    (println first-name second-name))

(defn hello-world []
    (println "Hello world!"))

(defn no-content [])

(defn only-no [value]
    (if (not (> value 0))
        (println "non-positive")
        (do)))

(defn print-fibonacci [n]
    (println (map fibonacci (range n))))

(defn select-case [value]
    (let [value2 (* value 2)]
        (if (= (inc value2) 1)
            "one"
            (if (= (inc value2) 5)
                "five"
                (if (not (= (inc value2) 7))
                    (throw
                        (RuntimeException.
                            (str "Unexpected case value" ": " (inc value2))))
                    "seven")))))

(defn short-circuit-and [a b]
    (if (and (> a 0) (> b 0))
        "positive"
        (if (or a b)
            "other"
            "unknown")))

(defn silhouette [left right]
    (if (> left right)
        (let [result left]
            result)
        (let [result right]
            result)))
