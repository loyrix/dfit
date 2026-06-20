import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'glass_surface.dart';

class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  const GlassAppBar({
    super.key,
    this.title,
    this.leading,
    this.actions,
    this.bottom,
    this.height = kToolbarHeight,
  });

  final Widget? title;
  final Widget? leading;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;
  final double height;

  @override
  Size get preferredSize => Size.fromHeight(height + (bottom?.preferredSize.height ?? 0.0));

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;

    return GlassSurface(
      isPremium: true,
      borderRadius: BorderRadius.zero,
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: Theme.of(context).brightness == Brightness.dark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        child: Container(
          padding: EdgeInsets.only(top: topPadding),
          height: preferredSize.height + topPadding,
          child: Column(
            children: [
              SizedBox(
                height: height,
                child: Row(
                  children: [
                    if (leading != null) leading! else const SizedBox(width: 16.0),
                    Expanded(
                      child: title != null
                          ? DefaultTextStyle(
                              style: Theme.of(context).textTheme.titleLarge!,
                              child: title!,
                            )
                          : const SizedBox.shrink(),
                    ),
                    ...?actions,
                  ],
                ),
              ),
              ?bottom,
            ],
          ),
        ),
      ),
    );
  }
}
